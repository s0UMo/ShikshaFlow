import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Wifi, WifiOff, User, GraduationCap, LayoutDashboard } from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedCount] = useState(0);

  const currentUserRaw = localStorage.getItem('shiksha_user');
  const user = currentUserRaw ? JSON.parse(currentUserRaw) : null;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('shiksha_user');
    navigate('/login');
  };

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 w-full"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Glass background layer */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-2.5 select-none shrink-0 group">
          <img src="/logo.png" alt="ShikshaFlow Logo" className="w-7 h-7 object-contain group-hover:scale-105 transition-transform" />
          <span className="font-semibold text-[15px] tracking-tight text-[#ededed]">
            Shiksha<span style={{ color: '#3ecf8e' }}>Flow</span>
          </span>
          <span className="hidden sm:inline-flex text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/20">
            Grade 6 Math
          </span>
        </Link>

        {/* ── Center Navigation ── */}
        {user && (
          <div className="hidden md:flex items-center gap-1 bg-[#141414] p-1 rounded-lg border border-white/5">
            <Link
              to="/student"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md text-[#ededed] hover:text-[#3ecf8e] transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Quiz</span>
            </Link>
            <Link
              to="/teacher"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md text-[#ededed] hover:text-[#3ecf8e] transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Teacher Heatmap</span>
            </Link>
          </div>
        )}

        {/* ── Right Status & Controls ── */}
        <div className="flex items-center gap-3">
          {/* Online / Offline Sync Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              isOnline
                ? 'bg-[#3ecf8e]/10 text-[#3ecf8e] border-[#3ecf8e]/30'
                : 'bg-amber-950/50 text-amber-300 border-amber-500/40 animate-pulse'
            }`}
          >
            {isOnline ? <Wifi className="w-3 h-3 text-[#3ecf8e]" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
            <span>{isOnline ? 'Online Sync' : `Offline (${queuedCount})`}</span>
          </div>

          {user ? (
            <div className="flex items-center gap-2 pl-3 border-l border-white/10">
              <span className="text-xs text-[#9ca3af] flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#3ecf8e]" />
                <span className="hidden sm:inline font-medium text-[#ededed]">{user.name}</span>
              </span>
              <button
                onClick={handleLogout}
                className="p-1 rounded-md text-[#9ca3af] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary-green text-xs px-3 py-1.5">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
