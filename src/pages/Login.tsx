import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Users, ArrowRight, ShieldCheck, BookOpen, BrainCircuit, Lock, Mail, UserCheck, KeyRound } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'demo' | 'email'>('demo');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Demo Persona Selection
  const handleSelectDemoPersona = (studentId: string, personaName: string, personaRole: 'student' | 'teacher') => {
    const user = {
      id: studentId,
      name: personaName,
      role: personaRole,
    };
    localStorage.setItem('shiksha_user', JSON.stringify(user));
    if (personaRole === 'teacher') {
      navigate('/teacher');
    } else {
      navigate('/student');
    }
  };

  // Firebase Email / Password Authentication Handler
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }
    if (isRegistering && !name) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      if (isRegistering) {
        // Register New Firebase Account
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = {
          id: cred.user.uid,
          name,
          email,
          role,
          createdAt: new Date().toISOString(),
        };
        
        // Save to Firestore
        await setDoc(doc(db, 'users', cred.user.uid), newUser);
        localStorage.setItem('shiksha_user', JSON.stringify(newUser));
        navigate(role === 'teacher' ? '/teacher' : '/student');
      } else {
        // Login Existing Account
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
        
        let loggedUser;
        if (userDoc.exists()) {
          loggedUser = userDoc.data();
        } else {
          loggedUser = {
            id: cred.user.uid,
            name: email.split('@')[0],
            email,
            role,
          };
        }
        
        localStorage.setItem('shiksha_user', JSON.stringify(loggedUser));
        navigate(loggedUser.role === 'teacher' ? '/teacher' : '/student');
      }
    } catch (err: any) {
      console.error('Authentication Error:', err);
      let msg = err.message || 'Authentication failed.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password credentials.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists.';
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Guest Anonymous Firebase Login
  const handleGuestLogin = async (guestRole: 'student' | 'teacher') => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const cred = await signInAnonymously(auth);
      const guestUser = {
        id: cred.user.uid,
        name: guestRole === 'teacher' ? 'Guest Teacher' : 'Guest Student',
        role: guestRole,
      };
      localStorage.setItem('shiksha_user', JSON.stringify(guestUser));
      navigate(guestRole === 'teacher' ? '/teacher' : '/student');
    } catch (err: any) {
      // Local fallback if offline
      const guestUser = {
        id: `guest_${Date.now()}`,
        name: guestRole === 'teacher' ? 'Guest Teacher' : 'Guest Student',
        role: guestRole,
      };
      localStorage.setItem('shiksha_user', JSON.stringify(guestUser));
      navigate(guestRole === 'teacher' ? '/teacher' : '/student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl flex flex-col items-center justify-center min-h-[calc(100vh-180px)] py-8 animate-fade-in">
      
      {/* Top Header Badge */}
      <div className="mb-6 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] text-xs font-semibold">
        <Sparkles className="w-3.5 h-3.5" />
        <span>ShikshaFlow Auth • Firebase Realtime Enabled</span>
      </div>

      <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-center text-white mb-3">
        Bridge the Rural-Urban <span className="text-shimmer">Learning Gap</span>
      </h1>
      <p className="text-sm text-[#9ca3af] text-center max-w-md mb-8">
        Offline-first adaptive difficulty scaling, real-time teacher gap heatmaps, and gamified mastery for Grade 6 Math.
      </p>

      {/* Main Authentication Card */}
      <div className="w-full card-feature-light p-6 md:p-8 space-y-6 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#3ecf8e]/5 rounded-full blur-2xl pointer-events-none"></div>

        {/* Auth Mode Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-[#141414] border border-white/5">
          <button
            onClick={() => setMode('demo')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === 'demo'
                ? 'bg-[#3ecf8e] text-[#0a0a0a] shadow-md shadow-[#3ecf8e]/20'
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            ⚡ Quick Demo Logins
          </button>
          <button
            onClick={() => setMode('email')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === 'email'
                ? 'bg-[#3ecf8e] text-[#0a0a0a] shadow-md shadow-[#3ecf8e]/20'
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            🔐 Firebase Auth
          </button>
        </div>

        {/* ── MODE 1: QUICK DEMO PERSONAS ── */}
        {mode === 'demo' ? (
          <div className="space-y-3">
            <h2 className="text-xs uppercase font-semibold tracking-wider text-[#9ca3af] mb-2">
              Select Demo Student Persona
            </h2>

            {/* Rohan Sharma */}
            <button
              onClick={() => handleSelectDemoPersona('student-1', 'Rohan Sharma', 'student')}
              className="w-full p-3.5 rounded-xl bg-[#1c1c1c] border border-white/10 hover:border-[#3ecf8e]/50 flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/20">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">Rohan Sharma</span>
                    <span className="badge-emerald">Student</span>
                  </div>
                  <p className="text-xs text-[#9ca3af]">Medium/High tier progress across topics</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9ca3af] group-hover:text-[#3ecf8e] group-hover:translate-x-1 transition-all" />
            </button>

            {/* Ananya Verma (Stuck in Fractions) */}
            <button
              onClick={() => handleSelectDemoPersona('student-2', 'Ananya Verma', 'student')}
              className="w-full p-3.5 rounded-xl bg-[#1c1c1c] border border-white/10 hover:border-rose-500/50 flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">Ananya Verma</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Stuck Alert Demo
                    </span>
                  </div>
                  <p className="text-xs text-[#9ca3af]">Triggers Early Warning alert on Teacher Dashboard</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9ca3af] group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
            </button>

            {/* Teacher Dashboard Persona */}
            <button
              onClick={() => handleSelectDemoPersona('teacher-1', 'Priya Verma (Teacher)', 'teacher')}
              className="w-full p-3.5 rounded-xl bg-[#1c1c1c] border border-white/10 hover:border-purple-500/50 flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">Teacher Workspace</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      Teacher Role
                    </span>
                  </div>
                  <p className="text-xs text-[#9ca3af]">Access class heatmap & real-time attempt logs</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9ca3af] group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        ) : (
          /* ── MODE 2: FIREBASE EMAIL / PASSWORD AUTH ── */
          <form onSubmit={handleEmailAuth} className="space-y-4 animate-fade-in">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Role Switcher */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#9ca3af]">Account Role:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`px-3 py-1 rounded-md text-xs font-medium border transition-all ${
                    role === 'student'
                      ? 'bg-[#3ecf8e]/10 text-[#3ecf8e] border-[#3ecf8e]/40'
                      : 'bg-[#141414] text-[#9ca3af] border-white/5'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`px-3 py-1 rounded-md text-xs font-medium border transition-all ${
                    role === 'teacher'
                      ? 'bg-purple-500/10 text-purple-300 border-purple-500/40'
                      : 'bg-[#141414] text-[#9ca3af] border-white/5'
                  }`}
                >
                  Teacher
                </button>
              </div>
            </div>

            {/* Full Name (if registering) */}
            {isRegistering && (
              <div className="space-y-1">
                <label className="text-xs text-[#9ca3af] block font-medium">Full Name</label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-[#9ca3af] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-xs text-[#9ca3af] block font-medium">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9ca3af] absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="student@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1c1c1c] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#3ecf8e]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs text-[#9ca3af] block font-medium">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9ca3af] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1c1c1c] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#3ecf8e]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary-green w-full text-xs py-2.5 flex items-center justify-center gap-2 font-semibold"
              >
                {loading ? (
                  <span>Connecting Firebase...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{isRegistering ? 'Create Firebase Account' : 'Sign In with Firebase'}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-[#9ca3af] pt-1">
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="hover:text-[#3ecf8e] underline"
                >
                  {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
                </button>

                <button
                  type="button"
                  onClick={() => handleGuestLogin('student')}
                  className="hover:text-[#3ecf8e]"
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Feature Pills Footer */}
        <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between text-xs text-[#52525b]">
          <span className="flex items-center gap-1 text-[#9ca3af]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3ecf8e]" />
            IndexedDB Offline Queue
          </span>
          <span className="flex items-center gap-1 text-[#9ca3af]">
            <BookOpen className="w-3.5 h-3.5 text-[#3ecf8e]" />
            32 Grade 6 Math Questions
          </span>
        </div>
      </div>
    </div>
  );
};
