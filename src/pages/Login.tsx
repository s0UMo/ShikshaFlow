import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Lock, Mail, UserCheck, KeyRound,
  ShieldCheck, BookOpen, Wifi, AlertCircle
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

// ─── helpers ────────────────────────────────────────────────────────────────
// Covers Firebase Auth error codes from SDK v9–v12
function friendlyAuthError(err: any): string {
  const code: string = err?.code ?? '';
  // Always log the raw code so it's visible in DevTools
  console.error('[Auth] Firebase error code:', code, err?.message);

  if (code.includes('email-already-in-use'))         return 'An account with this email already exists. Please sign in instead.';
  if (code.includes('weak-password'))                return 'Password must be at least 6 characters.';
  if (code.includes('invalid-email'))                return 'Please enter a valid email address.';
  // Firebase v12 combines wrong-password + user-not-found into this code:
  if (code.includes('invalid-login-credentials'))    return 'Incorrect email or password. Please try again.';
  if (code.includes('invalid-credential'))           return 'Incorrect email or password. Please try again.';
  if (code.includes('wrong-password'))               return 'Incorrect email or password. Please try again.';
  if (code.includes('user-not-found'))               return 'No account found with this email. Please create an account first.';
  if (code.includes('user-disabled'))                return 'This account has been disabled. Please contact support.';
  if (code.includes('too-many-requests'))            return 'Too many failed attempts. Please wait a moment and try again.';
  if (code.includes('network-request-failed'))       return 'No internet connection. Please check your network and try again.';
  if (code.includes('operation-not-allowed'))        return 'Email/password sign-in is not enabled. Please contact the administrator.';
  if (code.includes('requires-recent-login'))        return 'Please sign out and sign back in to continue.';
  // Show raw code as last resort so it is never a mystery
  return code ? `Sign-in failed (${code}). Please try again.` : 'Sign-in failed. Please try again.';
}

// ─── component ───────────────────────────────────────────────────────────────
export const Login: React.FC = () => {
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);
  const [role,     setRole]     = useState<'student' | 'teacher'>('student');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Switch tab → clear fields & error
  const switchTab = (registering: boolean) => {
    setIsRegistering(registering);
    setError(null);
    setName('');
    setEmail('');
    setPassword('');
  };

  // ── REGISTER ────────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!name.trim())  return setError('Please enter your full name.');
    if (!email.trim()) return setError('Please enter your email address.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    setLoading(true);
    setError(null);

    try {
      // 1. Create Firebase Auth account
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid  = cred.user.uid;

      const newUser = {
        id:        uid,
        name:      name.trim(),
        email:     email.trim(),
        role,
        createdAt: new Date().toISOString(),
      };

      // 2. Write user profile to Firestore (contains role info)
      try {
        await setDoc(doc(db, 'users', uid), newUser);
      } catch (dbErr) {
        console.warn('Firestore write warning (will use local):', dbErr);
      }

      // 3. Persist session locally
      localStorage.setItem('shiksha_user', JSON.stringify(newUser));

      // 4. Append to local student list (for teacher dashboard offline mode)
      if (role === 'student') {
        try {
          const existing: any[] = JSON.parse(localStorage.getItem('shiksha_students') || '[]');
          if (!existing.some((s) => s.id === uid || s.email === newUser.email)) {
            existing.push(newUser);
            localStorage.setItem('shiksha_students', JSON.stringify(existing));
          }
        } catch { /* ignore */ }
      }

      navigate(role === 'teacher' ? '/teacher' : '/student');
    } catch (err: any) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── SIGN IN ──────────────────────────────────────────────────────────────────
  const handleSignIn = async () => {
    if (!email.trim()) return setError('Please enter your email address.');
    if (!password)     return setError('Please enter your password.');

    setLoading(true);
    setError(null);

    try {
      // 1. Authenticate with Firebase Auth
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid  = cred.user.uid;

      // 2. Fetch user profile from Firestore (has role info)
      let userObj: any = null;
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          userObj = snap.data();
        }
      } catch (dbErr) {
        console.warn('Firestore read warning (will use local cache):', dbErr);
      }

      // 3. If Firestore doc missing, check local cache as fallback
      if (!userObj) {
        const cachedRaw = localStorage.getItem('shiksha_user');
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached?.id === uid) userObj = cached;
        }
      }

      // 4. If still missing, user registered before Firestore was set up — 
      //    create a minimal profile so they can continue (default: student)
      if (!userObj) {
        userObj = {
          id:    uid,
          name:  email.split('@')[0],
          email: email.trim(),
          role:  'student',
        };
        // Attempt to write it back
        try { await setDoc(doc(db, 'users', uid), userObj); } catch { /* ignore */ }
      }

      // 5. Persist locally and navigate
      localStorage.setItem('shiksha_user', JSON.stringify(userObj));

      // Sync to student list if needed
      if (userObj.role === 'student') {
        try {
          const existing: any[] = JSON.parse(localStorage.getItem('shiksha_students') || '[]');
          if (!existing.some((s) => s.id === userObj.id)) {
            existing.push(userObj);
            localStorage.setItem('shiksha_students', JSON.stringify(existing));
          }
        } catch { /* ignore */ }
      }

      navigate(userObj.role === 'teacher' ? '/teacher' : '/student');
    } catch (err: any) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── SUBMIT ──────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) handleRegister();
    else               handleSignIn();
  };

  // ─── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-160px)] py-10 animate-fade-in">

      {/* Hero */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] text-[11px] font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Adaptive Learning · Offline-First PWA
        </div>
        <h1 className="text-3xl md:text-[38px] font-medium tracking-tight text-white leading-tight">
          {isRegistering ? 'Join' : 'Sign in to'}<br />
          <span className="text-shimmer">ShikshaFlow</span>
        </h1>
        <p className="text-sm text-[#9ca3af] max-w-sm mx-auto">
          Personalized adaptive difficulty scaling and real-time teacher analytics for Grade 6 Math.
        </p>
      </div>

      {/* Card */}
      <div className="w-full card-feature-light overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-white/[0.06]">
          {([
            { label: 'Sign In',        registering: false },
            { label: 'Create Account', registering: true  },
          ] as const).map(({ label, registering }) => (
            <button key={label} type="button" onClick={() => switchTab(registering)}
              className={`flex-1 py-3 text-xs font-semibold transition-all border-b-2 ${
                isRegistering === registering
                  ? 'text-[#3ecf8e] border-[#3ecf8e] bg-[#3ecf8e]/5'
                  : 'text-[#9ca3af] border-transparent hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Role selector — register only */}
          {isRegistering && (
            <div className="space-y-1.5">
              <span className="text-xs text-[#9ca3af]">I am a:</span>
              <div className="flex gap-2">
                {(['student', 'teacher'] as const).map((r) => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border capitalize transition-all ${
                      role === r
                        ? r === 'teacher'
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/40'
                          : 'bg-[#3ecf8e]/10 text-[#3ecf8e] border-[#3ecf8e]/40'
                        : 'bg-[#141414] text-[#9ca3af] border-white/[0.06] hover:text-white'
                    }`}>
                    {r === 'student' ? '🎒 Student' : '📋 Teacher'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Full Name — register only */}
          {isRegistering && (
            <div className="space-y-1">
              <label className="text-xs text-[#9ca3af] font-medium">Full Name</label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-[#52525b] absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Your full name" value={name}
                  onChange={(e) => setName(e.target.value)} autoComplete="name"
                  className="w-full bg-[#1c1c1c] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-[#3ecf8e]/60 transition-colors" />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs text-[#9ca3af] font-medium">Email address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#52525b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="email" placeholder="you@school.edu" value={email}
                onChange={(e) => setEmail(e.target.value)} autoComplete="email"
                className="w-full bg-[#1c1c1c] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-[#3ecf8e]/60 transition-colors" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs text-[#9ca3af] font-medium">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#52525b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                className="w-full bg-[#1c1c1c] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-[#3ecf8e]/60 transition-colors" />
            </div>
            {isRegistering && <p className="text-[11px] text-[#52525b]">Minimum 6 characters.</p>}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="btn-primary-green w-full py-2.5 font-semibold text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
            <KeyRound className="w-4 h-4" />
            {loading
              ? 'Please wait…'
              : isRegistering ? 'Create Account' : 'Sign In'}
          </button>

        </form>

        {/* Footer */}
        <div className="border-t border-white/[0.06] px-6 py-3 bg-[#141414] flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] text-[#52525b] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3ecf8e]" /> Offline-First PWA
          </span>
          <span className="text-[11px] text-[#52525b] flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-[#3ecf8e]" /> Firebase Realtime Sync
          </span>
          <span className="text-[11px] text-[#52525b] flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#3ecf8e]" /> 32 Grade 6 Questions
          </span>
        </div>
      </div>
    </div>
  );
};
