import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Users, ArrowRight, ShieldCheck, BookOpen, 
  BrainCircuit, Lock, Mail, UserCheck, KeyRound, Wifi
} from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'demo' | 'email'>('demo');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const DEMO_PERSONAS = [
    {
      id: 'student-1', name: 'Rohan Sharma', role: 'student' as const,
      subtitle: 'Medium/High progress across all topics',
      icon: <BrainCircuit className="w-5 h-5" />,
      accent: 'text-[#3ecf8e] border-[#3ecf8e]/30 bg-[#3ecf8e]/10',
      hover: 'hover:border-[#3ecf8e]/60',
      tag: 'Student',
      tagColor: 'bg-[#3ecf8e]/10 text-[#3ecf8e] border-[#3ecf8e]/30',
    },
    {
      id: 'student-2', name: 'Ananya Verma', role: 'student' as const,
      subtitle: 'Triggers Early Warning alert on Teacher view',
      icon: <UserCheck className="w-5 h-5" />,
      accent: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
      hover: 'hover:border-rose-500/60',
      tag: 'Stuck Alert Demo',
      tagColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    },
    {
      id: 'teacher-1', name: 'Priya Verma', role: 'teacher' as const,
      subtitle: 'Access class heatmap & realtime attempt logs',
      icon: <Users className="w-5 h-5" />,
      accent: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
      hover: 'hover:border-purple-500/60',
      tag: 'Teacher',
      tagColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    },
  ];

  const handleDemoLogin = (persona: typeof DEMO_PERSONAS[0]) => {
    const user = { id: persona.id, name: persona.name, role: persona.role };
    localStorage.setItem('shiksha_user', JSON.stringify(user));
    navigate(persona.role === 'teacher' ? '/teacher' : '/student');
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setErrorMessage('Please fill in all fields.');
    if (isRegistering && !name) return setErrorMessage('Please enter your full name.');
    setLoading(true);
    setErrorMessage(null);
    try {
      if (isRegistering) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = { id: cred.user.uid, name, email, role, createdAt: new Date().toISOString() };
        await setDoc(doc(db, 'users', cred.user.uid), newUser);
        localStorage.setItem('shiksha_user', JSON.stringify(newUser));
        navigate(role === 'teacher' ? '/teacher' : '/student');
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
        const loggedUser = userDoc.exists()
          ? userDoc.data()
          : { id: cred.user.uid, name: email.split('@')[0], email, role };
        localStorage.setItem('shiksha_user', JSON.stringify(loggedUser));
        navigate(loggedUser.role === 'teacher' ? '/teacher' : '/student');
      }
    } catch (err: any) {
      const code = err?.code || '';
      setErrorMessage(
        code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')
          ? 'Invalid email or password.'
          : code.includes('email-already-in-use')
          ? 'Account already exists. Try signing in.'
          : err.message || 'Authentication failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const cred = await signInAnonymously(auth);
      const guestUser = { id: cred.user.uid, name: 'Guest Student', role: 'student' };
      localStorage.setItem('shiksha_user', JSON.stringify(guestUser));
      navigate('/student');
    } catch {
      localStorage.setItem('shiksha_user', JSON.stringify({ id: `guest_${Date.now()}`, name: 'Guest Student', role: 'student' }));
      navigate('/student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-180px)] py-10 animate-fade-in">

      {/* ── Hero headline ── */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] text-[11px] font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          IEMHACKS 4.0 · EdTech Track · PWA
        </div>
        <h1 className="text-3xl md:text-[40px] font-medium tracking-tight text-white leading-tight">
          Personalized Adaptive<br />
          <span className="text-shimmer">Learning for Every Student</span>
        </h1>
        <p className="text-sm text-[#9ca3af] max-w-sm mx-auto leading-relaxed">
          Offline-first Grade 6 Math with 3-tier adaptive difficulty scaling and real-time teacher gap analytics.
        </p>
      </div>

      {/* ── Auth Card ── */}
      <div className="w-full card-feature-light overflow-hidden">

        {/* Tab Switcher */}
        <div className="flex border-b border-white/[0.06]">
          <button
            onClick={() => setMode('demo')}
            className={`flex-1 py-3 text-xs font-semibold transition-all border-b-2 ${
              mode === 'demo'
                ? 'text-[#3ecf8e] border-[#3ecf8e] bg-[#3ecf8e]/5'
                : 'text-[#9ca3af] border-transparent hover:text-white'
            }`}
          >
            ⚡ Quick Demo
          </button>
          <button
            onClick={() => setMode('email')}
            className={`flex-1 py-3 text-xs font-semibold transition-all border-b-2 ${
              mode === 'email'
                ? 'text-[#3ecf8e] border-[#3ecf8e] bg-[#3ecf8e]/5'
                : 'text-[#9ca3af] border-transparent hover:text-white'
            }`}
          >
            🔐 Firebase Auth
          </button>
        </div>

        <div className="p-6 space-y-3">

          {/* ── DEMO MODE ── */}
          {mode === 'demo' ? (
            <>
              <p className="text-[11px] text-[#52525b] uppercase tracking-wider font-semibold mb-4">
                Select a demo persona to continue
              </p>
              {DEMO_PERSONAS.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => handleDemoLogin(persona)}
                  className={`w-full p-4 rounded-xl bg-[#1c1c1c] border border-white/[0.08] ${persona.hover} flex items-center justify-between text-left transition-all duration-200 group`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-lg border ${persona.accent}`}>
                      {persona.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-white text-sm">{persona.name}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${persona.tagColor}`}>
                          {persona.tag}
                        </span>
                      </div>
                      <p className="text-xs text-[#9ca3af]">{persona.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#52525b] group-hover:text-[#3ecf8e] group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              ))}
            </>
          ) : (
            /* ── EMAIL AUTH MODE ── */
            <form onSubmit={handleEmailAuth} className="space-y-4 animate-fade-in">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {errorMessage}
                </div>
              )}

              {/* Role Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9ca3af]">Role:</span>
                {(['student', 'teacher'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`px-3 py-1 rounded-md text-xs font-medium border capitalize transition-all ${
                      role === r
                        ? r === 'teacher'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/40'
                          : 'bg-[#3ecf8e]/10 text-[#3ecf8e] border-[#3ecf8e]/40'
                        : 'bg-[#141414] text-[#9ca3af] border-white/[0.06]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {isRegistering && (
                <div className="space-y-1">
                  <label className="text-xs text-[#9ca3af] font-medium">Full Name</label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-[#52525b] absolute left-3 top-2.5" />
                    <input type="text" required placeholder="Your full name" value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#1c1c1c] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#3ecf8e]/60 transition-colors" />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-[#9ca3af] font-medium">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#52525b] absolute left-3 top-2.5" />
                  <input type="email" required placeholder="student@school.edu" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#3ecf8e]/60 transition-colors" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[#9ca3af] font-medium">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#52525b] absolute left-3 top-2.5" />
                  <input type="password" required placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#3ecf8e]/60 transition-colors" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary-green w-full py-2.5 flex items-center justify-center gap-2 font-semibold">
                <KeyRound className="w-4 h-4" />
                <span>{loading ? 'Connecting...' : isRegistering ? 'Create Account' : 'Sign In'}</span>
              </button>

              <div className="flex items-center justify-between text-xs text-[#9ca3af]">
                <button type="button" onClick={() => { setIsRegistering(!isRegistering); setErrorMessage(null); }}
                  className="hover:text-[#3ecf8e] transition-colors">
                  {isRegistering ? 'Already have an account?' : 'New here? Register'}
                </button>
                <button type="button" onClick={handleGuestLogin}
                  className="hover:text-[#3ecf8e] transition-colors">
                  Continue as Guest
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Capabilities Row */}
        <div className="border-t border-white/[0.06] px-6 py-3 bg-[#141414] flex items-center justify-between">
          <span className="text-[11px] text-[#52525b] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3ecf8e]" /> Offline-First PWA
          </span>
          <span className="text-[11px] text-[#52525b] flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-[#3ecf8e]" /> Firebase Realtime Sync
          </span>
          <span className="text-[11px] text-[#52525b] flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#3ecf8e]" /> 32 Math Questions
          </span>
        </div>
      </div>
    </div>
  );
};
