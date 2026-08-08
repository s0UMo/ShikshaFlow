import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, ArrowRight, Flame, Target, CheckCircle2,
  XCircle, Clock, Lock, Sparkles, TrendingUp, Zap, Star, Bot
} from 'lucide-react';
import type { MathTopic, DifficultyTier, StudentProgress, Attempt } from '../types/schema';
import { BADGE_DEFINITIONS } from '../services/badgeService';

const TOPICS: MathTopic[] = ['fractions', 'ratios', 'geometry', 'decimals'];

const TOPIC_META: Record<MathTopic, { emoji: string; label: string; desc: string }> = {
  fractions: { emoji: '½', label: 'Fractions',  desc: 'Parts of a whole, equivalent fractions' },
  ratios:    { emoji: '∶', label: 'Ratios',     desc: 'Comparing quantities, proportions' },
  geometry:  { emoji: '△', label: 'Geometry',   desc: 'Shapes, angles, perimeter & area' },
  decimals:  { emoji: '0.', label: 'Decimals',  desc: 'Decimal place value, operations' },
};

const TIER_META: Record<DifficultyTier, { label: string; color: string; bar: string; glow: string }> = {
  easy:   { label: 'Easy',   color: 'text-sky-400    bg-sky-500/10    border-sky-500/30',    bar: 'bg-sky-400',    glow: '' },
  medium: { label: 'Medium', color: 'text-amber-400  bg-amber-500/10  border-amber-500/30',  bar: 'bg-amber-400',  glow: 'shadow-amber-500/10' },
  hard:   { label: 'Hard',   color: 'text-[#3ecf8e]  bg-[#3ecf8e]/10  border-[#3ecf8e]/30',  bar: 'bg-[#3ecf8e]',  glow: 'shadow-[#3ecf8e]/15' },
};

const BADGE_COLORS: Record<string, { bg: string; border: string; glow: string; text: string }> = {
  streak_3:         { bg: 'from-amber-500/30 to-orange-600/20',   border: 'border-amber-500/50',   glow: 'shadow-amber-500/30',   text: 'text-amber-300'   },
  streak_5:         { bg: 'from-purple-500/30 to-pink-600/20',    border: 'border-purple-500/50',  glow: 'shadow-purple-500/30',  text: 'text-purple-300'  },
  fractions_master: { bg: 'from-emerald-500/30 to-teal-600/20',   border: 'border-emerald-500/50', glow: 'shadow-emerald-500/30', text: 'text-emerald-300' },
  ratios_master:    { bg: 'from-blue-500/30 to-indigo-600/20',    border: 'border-blue-500/50',    glow: 'shadow-blue-500/30',    text: 'text-blue-300'    },
  geometry_master:  { bg: 'from-violet-500/30 to-purple-600/20',  border: 'border-violet-500/50',  glow: 'shadow-violet-500/30',  text: 'text-violet-300'  },
  decimals_master:  { bg: 'from-cyan-500/30 to-blue-600/20',      border: 'border-cyan-500/50',    glow: 'shadow-cyan-500/30',    text: 'text-cyan-300'    },
};

const ALL_BADGE_IDS = Object.keys(BADGE_DEFINITIONS);

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const userRaw = localStorage.getItem('shiksha_user');
  const user    = userRaw ? JSON.parse(userRaw) : null;

  const [progressList, setProgressList] = useState<StudentProgress[]>([]);
  const [attempts, setAttempts]         = useState<Attempt[]>([]);

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return; }
    try {
      const p = localStorage.getItem('shiksha_progress');
      if (p) setProgressList(JSON.parse(p));
      const a = localStorage.getItem('shiksha_attempts');
      if (a) setAttempts(JSON.parse(a));
    } catch { /* ignore */ }
  }, []);

  if (!user) return null;

  const getProgress = (topic: MathTopic): StudentProgress | undefined =>
    progressList.find((p) => p.studentId === user.id && p.topic === topic);

  // Aggregate stats
  const myAttempts  = attempts.filter((a) => a.studentId === user.id);
  const totalDone   = myAttempts.length;
  const correct     = myAttempts.filter((a) => a.isCorrect).length;
  const accuracy    = totalDone > 0 ? Math.round((correct / totalDone) * 100) : 0;
  const maxStreak   = Math.max(0, ...progressList.filter((p) => p.studentId === user.id).map((p) => p.streakCount ?? 0));
  const allBadges   = new Set<string>();
  progressList.filter((p) => p.studentId === user.id).forEach((p) => p.badges?.forEach((b) => allBadges.add(b)));
  const earnedBadges = Array.from(allBadges);

  const today = new Date().toDateString();
  const todayAttempts = myAttempts.filter((a) => new Date(a.timestamp).toDateString() === today).length;

  // Best tier across topics
  const tierRank: Record<DifficultyTier, number> = { easy: 0, medium: 1, hard: 2 };
  const topicsDone = TOPICS.filter((t) => getProgress(t));
  void tierRank; void topicsDone; // used for potential future tier display

  const recentAttempts = myAttempts
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 6);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in pb-16">

      {/* ── HERO WELCOME ── */}
      <div className="card-feature-light p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative">
        {/* Subtle radial glow behind */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3ecf8e 0%, transparent 70%)' }} />

        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className="badge-emerald">Student Portal</span>
            <span className="text-[11px] text-[#52525b]">Grade 6 · Adaptive Math</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-medium text-white tracking-tight">
            {greeting()}, <span className="text-shimmer">{user.name.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-sm text-[#9ca3af]">Pick up where you left off. Your progress is saved.</p>

          {/* Stat chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${
              maxStreak >= 3 ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-[#1c1c1c] text-[#9ca3af] border-white/[0.06]'
            }`}>
              <Flame className={`w-3.5 h-3.5 ${maxStreak >= 3 ? 'text-amber-400' : 'text-[#52525b]'}`} />
              {maxStreak} streak
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-[#1c1c1c] border-white/[0.06] text-xs font-semibold text-[#9ca3af]">
              <Target className="w-3.5 h-3.5 text-[#3ecf8e]" />
              {accuracy}% accuracy
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-[#1c1c1c] border-white/[0.06] text-xs font-semibold text-[#9ca3af]">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              {todayAttempts} today
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-[#1c1c1c] border-white/[0.06] text-xs font-semibold text-[#9ca3af]">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              {earnedBadges.length} badges
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/student/quiz')}
          className="btn-primary-green px-8 py-3 text-sm font-bold flex items-center gap-2 shrink-0 animate-pulse-glow relative z-10"
        >
          <BookOpen className="w-4 h-4" />
          Start Practice
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── AI QUIZ GENERATOR PRO FEATURE BANNER ── */}
      <div className="card-feature-light p-5 bg-gradient-to-r from-purple-950/40 via-[#1c1c1c] to-purple-950/20 border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-start gap-3.5 relative z-10">
          <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-300 shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase tracking-wider">
                PRO FEATURE
              </span>
              <span className="text-xs font-bold text-white">AI Custom Quiz Generator</span>
            </div>
            <p className="text-xs text-[#9ca3af]">
              Generate unlimited personalized practice quizzes on pizza fractions, sports ratios, shopping decimals, or custom prompts using AI!
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/student/ai-quiz')}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold text-xs flex items-center gap-2 shrink-0 shadow-lg shadow-purple-500/25 transition-all group"
        >
          <Sparkles className="w-4 h-4" />
          Generate AI Quiz
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* ── TOPIC PROGRESS CARDS ── */}
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#52525b] flex items-center gap-2 mb-3">
          <TrendingUp className="w-3.5 h-3.5 text-[#3ecf8e]" /> Topic Progress
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TOPICS.map((topic) => {
            const prog  = getProgress(topic);
            const tier  = prog?.currentTier ?? 'easy';
            const meta  = TIER_META[tier];
            const acc   = prog?.rollingAccuracy ?? 0;
            const total = prog?.totalAttempts ?? 0;

            return (
              <button
                key={topic}
                onClick={() => navigate('/student/quiz', { state: { topic } })}
                className={`card-feature-light p-5 text-left flex flex-col gap-3 group transition-all hover:-translate-y-0.5 ${tier === 'hard' ? 'shadow-lg ' + meta.glow : ''}`}
              >
                {/* Topic header */}
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center font-mono text-lg font-bold text-white group-hover:border-[#3ecf8e]/30 transition-colors">
                    {TOPIC_META[topic].emoji}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${meta.color}`}>
                    {meta.label}
                  </span>
                </div>

                <div>
                  <div className="text-sm font-semibold text-white mb-0.5">{TOPIC_META[topic].label}</div>
                  <div className="text-[11px] text-[#52525b] leading-snug">{TOPIC_META[topic].desc}</div>
                </div>

                {/* Accuracy bar */}
                {total > 0 ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[#52525b]">Accuracy</span>
                      <span className="font-semibold text-white">{acc}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#1c1c1c] overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${meta.bar}`}
                        style={{ width: `${acc}%` }} />
                    </div>
                    <div className="text-[10px] text-[#52525b]">{total} question{total !== 1 ? 's' : ''} answered</div>
                  </div>
                ) : (
                  <div className="text-[11px] text-[#3f3f46] italic">Not started yet</div>
                )}

                <div className="flex items-center gap-1 text-[11px] text-[#3ecf8e] font-semibold group-hover:gap-2 transition-all mt-auto">
                  Practice <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ACHIEVEMENTS ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#52525b] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#3ecf8e]" /> Achievements
          </h2>
          <span className="text-[11px] text-[#52525b]">
            {earnedBadges.length}<span className="text-[#3f3f46]">/{ALL_BADGE_IDS.length} unlocked</span>
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {ALL_BADGE_IDS.map((badgeId) => {
            const badge  = BADGE_DEFINITIONS[badgeId];
            const earned = earnedBadges.includes(badgeId);
            const colors = BADGE_COLORS[badgeId];
            return (
              <div key={badgeId} title={`${badge.name}: ${badge.description}`}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                  earned
                    ? `bg-gradient-to-b ${colors.bg} ${colors.border} shadow-lg ${colors.glow}`
                    : 'bg-[#141414] border-white/[0.04] opacity-40'
                }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl ${
                  earned ? 'bg-black/20' : 'bg-[#1c1c1c]'
                }`}>
                  {earned ? badge.icon : <Lock className="w-4 h-4 text-[#3f3f46]" />}
                </div>
                <span className={`text-[10px] font-semibold text-center leading-tight ${
                  earned ? colors.text : 'text-[#3f3f46]'
                }`}>
                  {badge.name}
                </span>
                {earned && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#3ecf8e] flex items-center justify-center">
                    <span className="text-[9px] text-[#0a0a0a] font-bold">✓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RECENT ACTIVITY ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#52525b] flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#3ecf8e]" /> Recent Activity
          </h2>
          {recentAttempts.length > 0 && (
            <button onClick={() => navigate('/student/quiz')}
              className="text-[11px] text-[#3ecf8e] hover:underline flex items-center gap-1">
              Continue <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {recentAttempts.length === 0 ? (
          <div className="card-feature-light p-10 flex flex-col items-center gap-3 text-center">
            <BookOpen className="w-8 h-8 text-[#52525b]" />
            <p className="text-sm text-[#9ca3af] font-medium">No attempts yet</p>
            <p className="text-xs text-[#52525b]">Start a practice session to see your activity here.</p>
            <button onClick={() => navigate('/student/quiz')}
              className="btn-primary-green px-6 py-2 text-xs font-semibold mt-1">
              Start First Practice
            </button>
          </div>
        ) : (
          <div className="card-feature-light divide-y divide-white/[0.04]">
            {recentAttempts.map((attempt) => (
              <div key={attempt.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {attempt.isCorrect
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    : <XCircle     className="w-4 h-4 text-rose-400    shrink-0" />
                  }
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white capitalize">{attempt.topic}</span>
                      <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border ${
                        attempt.difficulty === 'hard'   ? 'bg-purple-500/10 text-purple-300 border-purple-500/25' :
                        attempt.difficulty === 'medium' ? 'bg-amber-500/10  text-amber-300  border-amber-500/25'  :
                                                          'bg-sky-500/10    text-sky-300    border-sky-500/25'
                      }`}>{attempt.difficulty}</span>
                    </div>
                    <div className="text-[11px] text-[#52525b]">
                      {new Date(attempt.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-[#52525b] font-mono">
                  <Clock className="w-3 h-3" />
                  {(attempt.responseTimeMs / 1000).toFixed(1)}s
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
