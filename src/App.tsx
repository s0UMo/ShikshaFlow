import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RefreshCw } from 'lucide-react';

// Production Code-Splitting with Lazy Page Loading
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const StudentQuiz = lazy(() => import('./pages/StudentQuiz').then(m => ({ default: m.StudentQuiz })));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));

const LoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
    <RefreshCw className="w-8 h-8 text-[#3ecf8e] animate-spin" />
    <span className="text-xs text-[#9ca3af] font-mono">Loading ShikshaFlow Workspace...</span>
  </div>
);

export const App: React.FC = () => {
  return (
    <Router>
      <div
        className="min-h-screen flex flex-col relative overflow-x-hidden"
        style={{ background: '#0a0a0a', color: '#ededed', fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {/* ── Supabase-style ambient layer — single top-centre diffuse emerald glow ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          <div
            style={{
              position: 'absolute',
              top: '-200px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '900px',
              height: '600px',
              borderRadius: '50%',
              background:
                'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(62,207,142,0.22) 0%, rgba(62,207,142,0.06) 55%, transparent 80%)',
              animation: 'topGlowPulse 8s ease-in-out infinite',
            }}
          />
          {/* Dot grid overlay — Supabase subtle background texture */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        <Navbar />

        <main className="relative z-10 flex-1 flex flex-col items-center pt-20 pb-16 px-6 max-w-7xl mx-auto w-full">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/student"
                element={
                  <ProtectedRoute requiredRole="student">
                    <StudentQuiz />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher"
                element={
                  <ProtectedRoute requiredRole="teacher">
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </main>

        {/* Footer */}
        <footer
          className="relative z-10 mt-auto w-full"
          style={{
            borderTop: '1px solid var(--sb-border)',
            background: 'var(--sb-bg)',
          }}
        >
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="ShikshaFlow" className="w-5 h-5 opacity-80" />
              <span className="text-xs font-semibold" style={{ color: 'var(--sb-fg)' }}>
                Shiksha<span style={{ color: '#3ecf8e' }}>Flow</span>
              </span>
              <span className="text-xs" style={{ color: 'var(--sb-fg-faint)' }}>
                &mdash; Personalized Adaptive Learning Platform (PWA)
              </span>
            </div>

            <nav className="flex items-center gap-5 text-xs text-[#9ca3af]">
              <span>Grade 6 Math</span>
              <span>•</span>
              <span>Offline-First (PWA)</span>
              <span>•</span>
              <span>Realtime Teacher Analytics</span>
            </nav>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
