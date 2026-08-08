import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, Wifi, WifiOff } from 'lucide-react';

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
    <nav className="glass-card sticky top-0 z-50 px-4 py-3 border-b border-slate-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-wide flex items-center gap-1.5">
              Shiksha<span className="gradient-text">Flow</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Grade 6 Math
              </span>
            </span>
          </div>
        </Link>

        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            isOnline 
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-900/20' 
              : 'bg-amber-950/50 text-amber-300 border-amber-500/40 animate-pulse'
          }`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isOnline ? 'Online Sync Active' : `Offline (${queuedCount} Queued)`}</span>
          </div>

          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <span className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                {user.name} ({user.role === 'teacher' ? 'Teacher' : 'Student'})
              </span>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
