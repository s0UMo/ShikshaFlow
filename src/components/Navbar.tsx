import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Wifi, WifiOff, User, GraduationCap, LayoutDashboard, RefreshCcw } from 'lucide-react';
import { getQueuedAttemptsCount, syncOfflineQueueToFirestore } from '../services/offlineDb';

export const Navbar: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [isOnline, setIsOnline]       = useState(navigator.onLine);
  const [queuedCount, setQueuedCount] = useState<number>(0);
  const [isSyncing, setIsSyncing]     = useState<boolean>(false);

  // Reactive auth state — re-reads whenever localStorage changes (login/logout)
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(() => {
    try { const raw = localStorage.getItem('shiksha_user'); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });

  useEffect(() => {
    const syncUser = () => {
      try {
        const raw = localStorage.getItem('shiksha_user');
        setUser(raw ? JSON.parse(raw) : null);
      } catch { setUser(null); }
    };
    window.addEventListener('storage', syncUser);
    // Also poll every 500ms so same-tab login/logout is reflected immediately
    const poll = setInterval(syncUser, 500);
    return () => { window.removeEventListener('storage', syncUser); clearInterval(poll); };
  }, []);


  useEffect(() => {
    updateQueueCount();

    const handleOnline  = async () => { setIsOnline(true); await triggerSync(); };
    const handleOffline = ()       => { setIsOnline(false); updateQueueCount(); };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const interval = setInterval(updateQueueCount, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const updateQueueCount = async () => {
    try { setQueuedCount(await getQueuedAttemptsCount()); } catch { setQueuedCount(0); }
  };

  const triggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await syncOfflineQueueToFirestore();
      await updateQueueCount();
    } catch (err) {
      console.warn('Sync error:', err);
    } finally {
      setTimeout(() => { setIsSyncing(false); updateQueueCount(); }, 600);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('shiksha_user');
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 w-full border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 select-none shrink-0 group">
          <img src="/logo.png" alt="ShikshaFlow" className="w-7 h-7 object-contain group-hover:scale-105 transition-transform" />
          <span className="font-semibold text-[15px] tracking-tight text-[#ededed]">
            Shiksha<span style={{ color: '#3ecf8e' }}>Flow</span>
          </span>
        </Link>

        {/* Navigation — only visible when authenticated */}
        {user && (
          <div className="hidden md:flex items-center gap-1 bg-[#141414] p-1 rounded-lg border border-white/[0.05]">
            {user.role !== 'teacher' && (
              <Link to="/student"
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                  location.pathname === '/student'
                    ? 'bg-[#3ecf8e] text-[#0a0a0a] font-semibold shadow-sm'
                    : 'text-[#9ca3af] hover:text-white'
                }`}>
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student Portal</span>
              </Link>
            )}
            {user.role === 'teacher' && (
              <Link to="/teacher"
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                  location.pathname === '/teacher'
                    ? 'bg-purple-500 text-white font-semibold shadow-sm'
                    : 'text-[#9ca3af] hover:text-white'
                }`}>
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Teacher Dashboard</span>
              </Link>
            )}
          </div>
        )}


        {/* Status & User Controls */}
        <div className="flex items-center gap-3">

          {/* Offline / Sync badge */}
          <div
            onClick={triggerSync}
            title={isOnline ? 'Click to sync' : 'Offline — answers queued in IndexedDB'}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border cursor-pointer select-none transition-all ${
              isSyncing
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse'
                : !isOnline
                ? 'bg-amber-950/50 text-amber-300 border-amber-500/40 animate-pulse'
                : queuedCount > 0
                ? 'bg-amber-950/50 text-amber-300 border-amber-500/40'
                : 'bg-[#3ecf8e]/10 text-[#3ecf8e] border-[#3ecf8e]/30'
            }`}
          >
            {isSyncing ? <RefreshCcw className="w-3 h-3 animate-spin" />
              : isOnline ? <Wifi className="w-3 h-3" />
              : <WifiOff className="w-3 h-3" />}
            <span className="hidden sm:inline">
              {isSyncing ? 'Syncing...'
                : !isOnline ? `Offline${queuedCount > 0 ? ` · ${queuedCount} queued` : ''}`
                : queuedCount > 0 ? `${queuedCount} pending`
                : 'Synced'}
            </span>
          </div>

          {/* User info + logout */}
          {user ? (
            <div className="flex items-center gap-2.5 pl-3 border-l border-white/[0.08]">
              <span className="flex items-center gap-1.5 text-xs">
                <User className="w-3.5 h-3.5 text-[#3ecf8e]" />
                <span className="hidden sm:inline font-medium text-[#ededed]">{user.name}</span>
              </span>
              <button onClick={handleLogout} title="Sign out"
                className="p-1.5 rounded-md text-[#9ca3af] hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary-green text-xs px-4 py-2">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
};
