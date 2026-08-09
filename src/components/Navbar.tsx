import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Wifi, WifiOff, GraduationCap, LayoutDashboard, RefreshCcw, Sparkles, Globe } from 'lucide-react';
import { getQueuedAttemptsCount, syncOfflineQueueToFirestore } from '../services/offlineDb';
import { SUPPORTED_LANGUAGES, getSelectedLanguage, setSelectedLanguage } from '../services/i18nService';
import type { LanguageCode } from '../services/i18nService';

export const Navbar: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [isOnline, setIsOnline]       = useState(navigator.onLine);
  const [queuedCount, setQueuedCount] = useState<number>(0);
  const [isSyncing, setIsSyncing]     = useState<boolean>(false);
  const [lang, setLang]               = useState<LanguageCode>(() => getSelectedLanguage());

  const handleLangChange = (newLang: LanguageCode) => {
    setLang(newLang);
    setSelectedLanguage(newLang);
  };

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

  // Sync indicator tooltip text
  const syncTitle = isSyncing
    ? 'Syncing…'
    : !isOnline
    ? `Offline${queuedCount > 0 ? ` · ${queuedCount} queued` : ''}`
    : queuedCount > 0
    ? `${queuedCount} pending sync`
    : 'All synced';

  // Sync indicator colour
  const syncColor = isSyncing
    ? 'text-indigo-400'
    : !isOnline || queuedCount > 0
    ? 'text-amber-400'
    : 'text-[#3ecf8e]';

  return (
    <nav className="fixed top-0 inset-x-0 z-50 w-full border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-5 h-13 flex items-center justify-between gap-4" style={{ height: '52px' }}>

        {/* ── Brand ── */}
        <Link to="/" className="flex items-center gap-2 select-none shrink-0 group">
          <img src="/logo.png" alt="ShikshaFlow" className="w-6 h-6 object-contain group-hover:scale-105 transition-transform" />
          <span className="font-semibold text-sm tracking-tight text-[#ededed]">
            Shiksha<span className="text-[#3ecf8e]">Flow</span>
          </span>
        </Link>

        {/* ── Nav links (authenticated) ── */}
        {user && (
          <div className="hidden md:flex items-center gap-0.5 bg-[#141414] p-1 rounded-lg border border-white/[0.05]">
            {user.role !== 'teacher' && (
              <>
                <Link to="/student"
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                    location.pathname === '/student'
                      ? 'bg-[#3ecf8e] text-[#0a0a0a] font-semibold'
                      : 'text-[#9ca3af] hover:text-white hover:bg-white/[0.04]'
                  }`}>
                  <GraduationCap className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
                <Link to="/student/ai-quiz"
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                    location.pathname === '/student/ai-quiz'
                      ? 'bg-[#3ecf8e] text-[#0a0a0a] font-semibold'
                      : 'text-[#9ca3af] hover:text-white hover:bg-white/[0.04]'
                  }`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Quiz
                </Link>
              </>
            )}
            {user.role === 'teacher' && (
              <Link to="/teacher"
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                  location.pathname === '/teacher'
                    ? 'bg-[#3ecf8e] text-[#0a0a0a] font-semibold'
                    : 'text-[#9ca3af] hover:text-white hover:bg-white/[0.04]'
                }`}>
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>
            )}
          </div>
        )}

        {/* ── Right side controls ── */}
        <div className="flex items-center gap-2">

          {/* Language selector — icon + compact dropdown */}
          {user?.role !== 'teacher' && !location.pathname.startsWith('/teacher') && (
            <div className="relative flex items-center">
              <Globe className="w-3.5 h-3.5 text-[#52525b] absolute left-2 pointer-events-none" />
              <select
                aria-label="Select Language"
                value={lang}
                onChange={(e) => handleLangChange(e.target.value as LanguageCode)}
                className="bg-transparent border border-white/[0.06] hover:border-white/[0.12] rounded-lg pl-6 pr-2 py-1 text-xs text-[#9ca3af] hover:text-white focus:outline-none focus:border-[#3ecf8e]/40 cursor-pointer transition-colors appearance-none"
                style={{ maxWidth: '100px' }}
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code} className="bg-[#141414]">{l.native}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sync indicator — icon-only dot with tooltip */}
          {user && (
            <button
              onClick={triggerSync}
              title={syncTitle}
              className={`p-1.5 rounded-md transition-colors hover:bg-white/[0.04] ${syncColor} ${isSyncing || (!isOnline && queuedCount > 0) ? 'animate-pulse' : ''}`}
            >
              {isSyncing
                ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                : isOnline
                ? <Wifi className="w-3.5 h-3.5" />
                : <WifiOff className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Divider */}
          {user && <span className="w-px h-4 bg-white/[0.08]" />}

          {/* User + logout */}
          {user ? (
            <div className="flex items-center gap-1">
              <span className="hidden sm:block text-xs font-medium text-[#9ca3af] max-w-[100px] truncate">
                {user.name.split(' ')[0]}
              </span>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-md text-[#52525b] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary-green text-xs px-3 py-1.5">Sign In</Link>
          )}
        </div>

      </div>
    </nav>
  );
};
