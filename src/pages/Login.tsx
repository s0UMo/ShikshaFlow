import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, UserCheck, Sparkles, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectRole = (role: 'student' | 'teacher', name: string, studentId?: string) => {
    const user = {
      id: studentId || (role === 'teacher' ? 'teacher-1' : 'student-demo'),
      name,
      role,
    };
    localStorage.setItem('shiksha_user', JSON.stringify(user));
    if (role === 'teacher') {
      navigate('/teacher');
    } else {
      navigate('/student');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to ShikshaFlow</h1>
          <p className="text-sm text-slate-400 mt-2">
            Adaptive Math Learning Platform for Rural & Urban Schools
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleSelectRole('student', 'Rohan Sharma', 'student-1')}
            className="w-full group p-4 rounded-xl glass-card border border-indigo-500/20 hover:border-indigo-500/50 flex items-center justify-between text-left transition-all duration-200 hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-300 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Continue as Student</h3>
                <p className="text-xs text-slate-400">Grade 6 Math Practice & Quizzes</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">Start →</span>
          </button>

          <button
            onClick={() => handleSelectRole('teacher', 'Priya Verma (Teacher)', 'teacher-1')}
            className="w-full group p-4 rounded-xl glass-card border border-purple-500/20 hover:border-purple-500/50 flex items-center justify-between text-left transition-all duration-200 hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-300 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Continue as Teacher</h3>
                <p className="text-xs text-slate-400">Class Heatmap & Learning Gaps</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-purple-400 group-hover:translate-x-1 transition-transform">View →</span>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            PWA Ready • Offline First • Hindi Support
          </span>
        </div>
      </div>
    </div>
  );
};
