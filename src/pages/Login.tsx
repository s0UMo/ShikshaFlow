import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Users, ArrowRight, ShieldCheck, BookOpen, BrainCircuit } from 'lucide-react';

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
    <div className="w-full max-w-xl flex flex-col items-center justify-center min-h-[calc(100vh-180px)] py-8 animate-fade-in">
      {/* Top Header Badge */}
      <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 text-[#3ecf8e] text-xs font-medium">
        <Sparkles className="w-3.5 h-3.5" />
        <span>IEMHACKS 4.0 EdTech Track • Adaptive Math Platform</span>
      </div>

      <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-center text-white mb-3">
        Bridge the Rural-Urban <span className="text-shimmer">Learning Gap</span>
      </h1>
      <p className="text-sm md:text-base text-[#9ca3af] text-center max-w-md mb-8">
        Offline-first personalized difficulty scaling, real-time teacher gap analytics, and Hindi audio support for Grade 6 Math.
      </p>

      {/* Main Role Selection Card */}
      <div className="w-full card-feature-light p-6 md:p-8 space-y-4 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#3ecf8e]/5 rounded-full blur-2xl pointer-events-none"></div>

        <h2 className="text-xs uppercase font-semibold tracking-wider text-[#9ca3af] mb-4">
          Select Your Workspace Role
        </h2>

        {/* Student Role Button */}
        <button
          onClick={() => handleSelectRole('student', 'Rohan Sharma', 'student-1')}
          className="w-full p-4 rounded-xl bg-[#1c1c1c] border border-white/10 hover:border-[#3ecf8e]/50 flex items-center justify-between text-left transition-all duration-200 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-lg bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/20 group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-base">Student Portal</h3>
                <span className="badge-emerald">Grade 6 Math</span>
              </div>
              <p className="text-xs text-[#9ca3af] mt-0.5">Adaptive 3-tier difficulty ladder & audio read-aloud</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#9ca3af] group-hover:text-[#3ecf8e] group-hover:translate-x-1 transition-all" />
        </button>

        {/* Teacher Role Button */}
        <button
          onClick={() => handleSelectRole('teacher', 'Priya Verma (Teacher)', 'teacher-1')}
          className="w-full p-4 rounded-xl bg-[#1c1c1c] border border-white/10 hover:border-purple-500/50 flex items-center justify-between text-left transition-all duration-200 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-base">Teacher Analytics</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Live Heatmap
                </span>
              </div>
              <p className="text-xs text-[#9ca3af] mt-0.5">Real-time student gap identification & stuck alerts</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#9ca3af] group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
        </button>

        {/* Feature Pills Footer */}
        <div className="pt-4 mt-6 border-t border-white/5 flex flex-wrap items-center justify-between text-xs text-[#52525b]">
          <span className="flex items-center gap-1 text-[#9ca3af]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3ecf8e]" />
            IndexedDB Offline Queue
          </span>
          <span className="flex items-center gap-1 text-[#9ca3af]">
            <BookOpen className="w-3.5 h-3.5 text-[#3ecf8e]" />
            30 Grade 6 Math Questions
          </span>
        </div>
      </div>
    </div>
  );
};
