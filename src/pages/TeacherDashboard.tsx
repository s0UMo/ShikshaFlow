import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, AlertTriangle, RefreshCw, BarChart3,
  CheckCircle2, XCircle, Clock, Search, X, ChevronRight,
  Award, TrendingUp, Activity, Filter, ArrowUpDown,
  Layers, PlusCircle, BookOpen, Pencil, Trash2,
  PieChart, Scale, Shapes, Hash
} from 'lucide-react';
import type { StudentProgress, User, MathTopic, Attempt, Question } from '../types/schema';
import { collection, onSnapshot } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '../services/firebase';
import { BADGE_DEFINITIONS } from '../services/badgeService';
import { getAllQuestionsLocal, subscribeQuestions, deleteTeacherQuestion } from '../services/questionService';
import { AddQuestionModal } from '../components/AddQuestionModal';

// ─── Constants ───────────────────────────────────────────────────────────────
const TOPICS: MathTopic[] = ['fractions', 'ratios', 'geometry', 'decimals'];
const TOPIC_META: Record<MathTopic, { icon: any; label: string }> = {
  fractions: { icon: PieChart, label: 'Fractions' },
  ratios:    { icon: Scale,    label: 'Ratios'    },
  geometry:  { icon: Shapes,   label: 'Geometry'  },
  decimals:  { icon: Hash,     label: 'Decimals' },
};

type SortField    = 'name' | 'accuracy' | 'attempts' | 'lastActive' | 'stuck';
type FilterStatus = 'all' | 'stuck' | 'hard' | 'medium' | 'easy';

// ─── Helper ──────────────────────────────────────────────────────────────────
function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000)   return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return `${Math.floor(diff / 86400_000)}d ago`;
}

// ─── Component ───────────────────────────────────────────────────────────────
export const TeacherDashboard: React.FC = () => {

  // Data
  const [students,     setStudents]     = useState<User[]>([]);
  const [progressList, setProgressList] = useState<StudentProgress[]>([]);
  const [attempts,     setAttempts]     = useState<Attempt[]>([]);
  const [questions,    setQuestions]    = useState<Question[]>(getAllQuestionsLocal());

  // UI state
  const [selectedStudent,   setSelectedStudent]   = useState<User | null>(null);
  const [searchQuery,       setSearchQuery]       = useState('');
  const [topicFilter,       setTopicFilter]       = useState<MathTopic | 'all'>('all');
  const [statusFilter,      setStatusFilter]      = useState<FilterStatus>('all');
  const [sortBy,            setSortBy]            = useState<SortField>('name');
  const [sortAsc,           setSortAsc]           = useState(true);
  const [activeTab,         setActiveTab]         = useState<'heatmap' | 'topics' | 'questions'>('heatmap');
  const [isRefreshing,      setIsRefreshing]      = useState(false);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion]     = useState<Question | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  const handleDeleteQuestion = async (qId: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      setDeletingQuestionId(qId);
      try {
        await deleteTeacherQuestion(qId);
        setQuestions(prev => prev.filter(q => q.id !== qId));
      } catch (err) {
        console.error('Failed to delete question:', err);
      } finally {
        setDeletingQuestionId(null);
      }
    }
  };

  // ── Load from localStorage ──────────────────────────────────────────────────
  const loadLocal = useCallback(() => {
    try {
      const rawS = localStorage.getItem('shiksha_students');
      const rawP = localStorage.getItem('shiksha_progress');
      const rawA = localStorage.getItem('shiksha_attempts');
      if (rawS) setStudents(JSON.parse(rawS).filter((u: User) => u.role === 'student'));
      if (rawP) setProgressList(JSON.parse(rawP));
      if (rawA) setAttempts(JSON.parse(rawA));
    } catch (e) { console.error('loadLocal error:', e); }
  }, []);

  // ── Firestore realtime listeners ────────────────────────────────────────────
  useEffect(() => {
    loadLocal();

    const unsubs: Unsubscribe[] = [];

    if (navigator.onLine) {
      try {
        unsubs.push(
          onSnapshot(collection(db, 'users'), (snap) => {
            const data = snap.docs.map(d => d.data() as User).filter(u => u.role === 'student');
            if (data.length > 0) {
              setStudents(data);
              localStorage.setItem('shiksha_students', JSON.stringify(data));
            }
          })
        );
        unsubs.push(
          onSnapshot(collection(db, 'studentProgress'), (snap) => {
            if (!snap.empty) {
              const data = snap.docs.map(d => d.data() as StudentProgress);
              setProgressList(data);
              localStorage.setItem('shiksha_progress', JSON.stringify(data));
            }
          })
        );
        unsubs.push(
          onSnapshot(collection(db, 'attempts'), (snap) => {
            if (!snap.empty) {
              const data = snap.docs.map(d => d.data() as Attempt);
              setAttempts(data);
              localStorage.setItem('shiksha_attempts', JSON.stringify(data));
            }
          })
        );
      } catch (err) {
        console.warn('Firestore listener error:', err);
      }
    }

    const unsubQuestions = subscribeQuestions(setQuestions);
    unsubs.push(unsubQuestions);

    const pollId = setInterval(loadLocal, 5000);
    const onStorage = () => loadLocal();
    window.addEventListener('storage', onStorage);

    return () => {
      unsubs.forEach(u => u());
      clearInterval(pollId);
      window.removeEventListener('storage', onStorage);
    };
  }, [loadLocal]);

  // ── Manual refresh ──────────────────────────────────────────────────────────
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadLocal();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // ─── Derived data ─────────────────────────────────────────────────────────
  const getProgress = (sid: string, topic: MathTopic) =>
    progressList.find(p => p.studentId === sid && p.topic === topic);

  const getOverallAcc = (sid: string) => {
    const ps = progressList.filter(p => p.studentId === sid);
    return ps.length ? Math.round(ps.reduce((s, p) => s + p.rollingAccuracy, 0) / ps.length) : 0;
  };

  const getTotalAttempts = (sid: string) => attempts.filter(a => a.studentId === sid).length;

  const getLastActive = (sid: string): number => {
    const ts = attempts.filter(a => a.studentId === sid).map(a => a.timestamp);
    return ts.length ? Math.max(...ts) : 0;
  };

  const isStuckInTopic = (sid: string, topic: MathTopic) => {
    const prog = getProgress(sid, topic);
    if (!prog) return false;
    const last2 = prog.rollingHistory.slice(-2);
    return (last2.length >= 2 && last2.every(r => !r)) || (prog.totalAttempts >= 3 && prog.rollingAccuracy < 40);
  };

  const isStuckAny = (sid: string) => TOPICS.some(t => isStuckInTopic(sid, t));

  const stuckItems = students.flatMap(student =>
    TOPICS.flatMap(topic => {
      const prog = getProgress(student.id, topic);
      if (!prog || !isStuckInTopic(student.id, topic)) return [];
      const last2 = prog.rollingHistory.slice(-2);
      const reason = last2.length >= 2 && last2.every(r => !r)
        ? `2 consecutive wrong at ${prog.currentTier.toUpperCase()}`
        : `${prog.rollingAccuracy}% accuracy`;
      return [{ student, topic, prog, reason }];
    })
  );

  const avgAccuracy = progressList.length
    ? Math.round(progressList.reduce((s, p) => s + p.rollingAccuracy, 0) / progressList.length)
    : null;

  const topicStats = TOPICS.map(topic => {
    const ps = progressList.filter(p => p.topic === topic);
    return {
      topic,
      total: ps.length,
      hard:   ps.filter(p => p.currentTier === 'hard').length,
      medium: ps.filter(p => p.currentTier === 'medium').length,
      easy:   ps.filter(p => p.currentTier === 'easy').length,
      avgAcc: ps.length ? Math.round(ps.reduce((s, p) => s + p.rollingAccuracy, 0) / ps.length) : 0,
      stuckCount: students.filter(s => isStuckInTopic(s.id, topic)).length,
    };
  });

  // ── Filtered + sorted student list ──────────────────────────────────────────
  const filtered = students
    .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 (s.email ?? '').toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(s => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'stuck') return isStuckAny(s.id);
      const scope = topicFilter === 'all'
        ? progressList.filter(p => p.studentId === s.id)
        : [getProgress(s.id, topicFilter)].filter(Boolean) as StudentProgress[];
      return scope.some(p => p.currentTier === statusFilter);
    })
    .sort((a, b) => {
      let d = 0;
      if (sortBy === 'name')       d = a.name.localeCompare(b.name);
      if (sortBy === 'accuracy')   d = getOverallAcc(a.id) - getOverallAcc(b.id);
      if (sortBy === 'attempts')   d = getTotalAttempts(a.id) - getTotalAttempts(b.id);
      if (sortBy === 'lastActive') d = getLastActive(a.id) - getLastActive(b.id);
      if (sortBy === 'stuck')      d = (isStuckAny(b.id) ? 1 : 0) - (isStuckAny(a.id) ? 1 : 0);
      return sortAsc ? d : -d;
    });

  const sortedAttempts = [...attempts].sort((a, b) => b.timestamp - a.timestamp);

  // ─── Tier pill style ────────────────────────────────────────────────────────
  function tierStyle(tier: string, stuck: boolean) {
    if (stuck) return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    if (tier === 'hard')   return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    if (tier === 'medium') return 'bg-amber-500/10  text-amber-300  border-amber-500/25';
    return 'bg-sky-500/10 text-sky-300 border-sky-500/25';
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#3ecf8e]" /> Class Analytics Dashboard
          </h1>
          <p className="text-xs text-[#52525b]">
            {students.length} student{students.length !== 1 ? 's' : ''} · {attempts.length} total attempts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddQuestionOpen(true)}
            className="btn-primary-green text-xs px-3.5 py-2 flex items-center gap-1.5 font-semibold"
          >
            <PlusCircle className="w-4 h-4" /> Add Question
          </button>
          <button onClick={handleRefresh}
            className="px-3.5 py-2 rounded-xl bg-[#1c1c1c] border border-white/[0.08] hover:border-white/[0.15] text-xs text-[#9ca3af] hover:text-white flex items-center gap-1.5 font-semibold transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Students', icon: <Users className="w-4 h-4" />,
            value: students.length > 0 ? students.length : '—',
            sub: filtered.length !== students.length ? `${filtered.length} shown` : 'registered',
            color: 'text-[#3ecf8e]'
          },
          {
            label: 'Needs Support', icon: <AlertTriangle className="w-4 h-4" />,
            value: stuckItems.length > 0 ? stuckItems.length : students.length > 0 ? '0' : '—',
            sub: 'flagged students', color: stuckItems.length > 0 ? 'text-rose-400' : 'text-[#52525b]'
          },
          {
            label: 'Total Attempts', icon: <Activity className="w-4 h-4" />,
            value: attempts.length > 0 ? attempts.length : '—',
            sub: 'logged attempts', color: 'text-purple-400'
          },
          {
            label: 'Class Accuracy', icon: <TrendingUp className="w-4 h-4" />,
            value: avgAccuracy !== null ? `${avgAccuracy}%` : '—',
            sub: 'rolling average', color: 'text-amber-400'
          },
        ].map(card => (
          <div key={card.label} className="card-feature-light p-4 space-y-2">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${card.color}`}>
              {card.icon} <span>{card.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{card.value}</div>
            <div className="text-[11px] text-[#52525b]">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── EARLY WARNING ── */}
      {stuckItems.length > 0 && (
        <div className="card-feature-light border-l-4 border-l-rose-500 p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Early Warning System
                <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 text-[11px] font-mono">
                  {stuckItems.length} flagged
                </span>
              </h2>
              <p className="text-xs text-[#52525b]">Students with 2 consecutive wrong answers or &lt;40% accuracy</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {stuckItems.map(({ student, topic, prog, reason }, i) => (
              <button key={i} onClick={() => setSelectedStudent(student)}
                className="p-3.5 rounded-xl bg-[#1c1c1c] border border-rose-500/25 hover:border-rose-500/50 text-left transition-all flex items-center justify-between gap-3 group">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white truncate">{student.name}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/25 shrink-0">
                      {topic}
                    </span>
                  </div>
                  <p className="text-xs text-rose-300/80">⚠ {reason}</p>
                  <p className="text-[11px] text-[#52525b]">
                    Tier: <strong className="text-white uppercase">{prog.currentTier}</strong> · {prog.rollingAccuracy}% acc
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#52525b] group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── TABS ── */}
      <div className="flex border-b border-white/[0.06] gap-1">
        {([
          { id: 'heatmap',   label: 'Student Matrix',  icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'topics',    label: 'Topic Breakdown', icon: <Layers    className="w-4 h-4" /> },
          { id: 'questions', label: `Question Bank (${questions.length})`, icon: <BookOpen className="w-4 h-4" /> },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-1 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all mr-4 ${
              activeTab === tab.id
                ? 'text-[#3ecf8e] border-[#3ecf8e]'
                : 'text-[#9ca3af] border-transparent hover:text-white'
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ─────────────────────────── TAB: HEATMAP ───────────────────────────── */}
      {activeTab === 'heatmap' && (
        <div className="card-feature-light overflow-hidden">

          {/* Filter bar */}
          <div className="p-4 border-b border-white/[0.06] bg-[#141414] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">

              {/* Topic pills */}
              <div className="flex items-center gap-0.5 bg-[#1c1c1c] p-0.5 rounded-lg border border-white/[0.06]">
                <Filter className="w-3 h-3 text-[#52525b] mx-1.5" />
                {(['all', ...TOPICS] as const).map(t => {
                  const TopicIcon = t !== 'all' ? TOPIC_META[t].icon : null;
                  return (
                    <button key={t} onClick={() => setTopicFilter(t)}
                      className={`text-[11px] px-2.5 py-1 rounded-md font-medium capitalize transition-all flex items-center gap-1.5 ${
                        topicFilter === t
                          ? 'bg-[#3ecf8e] text-[#0a0a0a] font-semibold'
                          : 'text-[#9ca3af] hover:text-white'
                      }`}>
                      {TopicIcon && <TopicIcon className="w-3 h-3 shrink-0" />}
                      <span>{t === 'all' ? 'All' : t}</span>
                    </button>
                  );
                })}
              </div>

              {/* Status */}
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as FilterStatus)}
                className="bg-[#1c1c1c] border border-white/[0.08] rounded-lg px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#3ecf8e]/50 cursor-pointer">
                <option value="all">Status: All</option>
                <option value="stuck">⚠ Needs Support</option>
                <option value="hard">🟢 Hard Tier</option>
                <option value="medium">🟡 Medium Tier</option>
                <option value="easy">🔵 Easy Tier</option>
              </select>

              {/* Sort */}
              <div className="flex items-center gap-1">
                <select value={sortBy} onChange={e => setSortBy(e.target.value as SortField)}
                  className="bg-[#1c1c1c] border border-white/[0.08] rounded-lg px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#3ecf8e]/50 cursor-pointer">
                  <option value="name">Sort: Name</option>
                  <option value="accuracy">Sort: Accuracy</option>
                  <option value="attempts">Sort: Attempts</option>
                  <option value="lastActive">Sort: Last Active</option>
                  <option value="stuck">Sort: Needs Help First</option>
                </select>
                <button onClick={() => setSortAsc(v => !v)}
                  className="p-1.5 rounded-lg bg-[#1c1c1c] border border-white/[0.08] text-[#9ca3af] hover:text-white"
                  title={sortAsc ? 'Ascending' : 'Descending'}>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#52525b] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search name or email…" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-[#1c1c1c] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white placeholder-[#52525b] focus:outline-none focus:border-[#3ecf8e]/50 w-52 transition-colors" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {students.length === 0 ? (
              <div className="p-16 flex flex-col items-center gap-4 text-center">
                <div className="p-4 rounded-2xl bg-[#1c1c1c] border border-white/[0.06]">
                  <Users className="w-8 h-8 text-[#3f3f46]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">No students yet</p>
                  <p className="text-xs text-[#52525b] mt-1">Students will appear here once they take their first quiz.</p>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 flex flex-col items-center gap-3 text-center">
                <Search className="w-6 h-6 text-[#3f3f46]" />
                <p className="text-sm text-[#9ca3af]">No students match your filters.</p>
                <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); setTopicFilter('all'); }}
                  className="text-xs text-[#3ecf8e] underline cursor-pointer">Clear filters</button>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="py-3 px-5 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Student</th>
                    {TOPICS.map(t => {
                      const TopicIcon = TOPIC_META[t].icon;
                      return (
                        <th key={t} className="py-3 px-4 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider text-center">
                          <span className="inline-flex items-center gap-1">
                            <TopicIcon className="w-3 h-3 text-[#3ecf8e]" />
                            <span className="capitalize">{t}</span>
                          </span>
                        </th>
                      );
                    })}
                    <th className="py-3 px-4 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider text-center">Avg</th>
                    <th className="py-3 px-4 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider text-center">Attempts</th>
                    <th className="py-3 px-4 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider text-right">Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(student => {
                    const acc      = getOverallAcc(student.id);
                    const att      = getTotalAttempts(student.id);
                    const last     = getLastActive(student.id);
                    const stuck    = isStuckAny(student.id);

                    return (
                      <tr key={student.id} onClick={() => setSelectedStudent(student)}
                        className={`border-b border-white/[0.04] hover:bg-[#141414] cursor-pointer transition-colors group ${stuck ? 'bg-rose-500/[0.02]' : ''}`}>

                        {/* Name + avatar */}
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                              stuck
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                : 'bg-[#3ecf8e]/10 border-[#3ecf8e]/20 text-[#3ecf8e]'
                            }`}>
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white group-hover:text-[#3ecf8e] transition-colors truncate flex items-center gap-2">
                                {student.name}
                                {stuck && <span className="text-[10px] text-rose-400 font-normal">⚠ needs help</span>}
                              </div>
                              <div className="text-[11px] text-[#52525b] truncate">{student.email || student.id}</div>
                            </div>
                          </div>
                        </td>

                        {/* Per-topic cells */}
                        {TOPICS.map(topic => {
                          const prog   = getProgress(student.id, topic);
                          const tStuck = isStuckInTopic(student.id, topic);
                          return (
                            <td key={topic} className="py-3 px-4 text-center">
                              {prog ? (
                                <div className={`inline-flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg border text-[10px] font-semibold ${tierStyle(prog.currentTier, tStuck)}`}>
                                  <span className="uppercase tracking-wider">{prog.currentTier}</span>
                                  <span className="opacity-75 font-normal">{prog.rollingAccuracy}%</span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-[#3f3f46]">—</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Overall acc */}
                        <td className="py-3 px-4 text-center">
                          {att > 0
                            ? <span className={`text-xs font-mono font-semibold ${acc >= 70 ? 'text-emerald-400' : acc >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>{acc}%</span>
                            : <span className="text-[11px] text-[#3f3f46]">—</span>
                          }
                        </td>

                        {/* Total attempts */}
                        <td className="py-3 px-4 text-center text-xs text-[#9ca3af] font-mono">
                          {att > 0 ? att : <span className="text-[#3f3f46]">—</span>}
                        </td>

                        {/* Last active */}
                        <td className="py-3 px-4 text-right text-[11px] text-[#52525b]">
                          {last > 0 ? relativeTime(last) : <span className="text-[#3f3f46]">never</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────── TAB: TOPICS ────────────────────────────── */}
      {activeTab === 'topics' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topicStats.map(({ topic, total, hard, medium, easy, avgAcc, stuckCount }) => (
            <div key={topic} className="card-feature-light p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const TopicIcon = TOPIC_META[topic].icon;
                    return (
                      <div className="w-9 h-9 rounded-xl bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center text-[#3ecf8e] shrink-0">
                        <TopicIcon className="w-4 h-4" />
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="text-base font-bold text-white capitalize">{topic}</h3>
                    <p className="text-[11px] text-[#52525b]">{total} students with data</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-semibold text-[#3ecf8e]">{total > 0 ? `${avgAcc}%` : '—'}</div>
                  {stuckCount > 0 && (
                    <div className="text-[10px] text-rose-400 font-mono">{stuckCount} need help</div>
                  )}
                </div>
              </div>

              {total > 0 ? (
                <>
                  {/* Distribution bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-[#9ca3af]">
                      <span>Tier distribution</span>
                      <span className="font-mono">{hard}H · {medium}M · {easy}E</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#141414] overflow-hidden flex gap-px">
                      {hard   > 0 && <div style={{ flex: hard   }} className="bg-emerald-500 rounded-l-full" title={`Hard: ${hard}`} />}
                      {medium > 0 && <div style={{ flex: medium }} className="bg-amber-500"  title={`Med: ${medium}`} />}
                      {easy   > 0 && <div style={{ flex: easy   }} className="bg-sky-500 rounded-r-full" title={`Easy: ${easy}`} />}
                    </div>
                    <div className="flex gap-3 text-[10px]">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>Hard</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"/>Medium</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500 inline-block"/>Easy</span>
                    </div>
                  </div>

                  {/* Per-tier accuracy */}
                  <div className="grid grid-cols-3 gap-2">
                    {(['hard', 'medium', 'easy'] as const).map(tier => {
                      const ps = progressList.filter(p => p.topic === topic && p.currentTier === tier);
                      const a  = ps.length ? Math.round(ps.reduce((s, p) => s + p.rollingAccuracy, 0) / ps.length) : null;
                      return (
                        <div key={tier} className={`p-2 rounded-lg border text-center text-[10px] ${tierStyle(tier, false)}`}>
                          <div className="font-semibold uppercase">{tier}</div>
                          <div className="font-mono mt-0.5">{a !== null ? `${a}%` : '—'}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-[11px] text-[#3f3f46] italic py-2">No student activity yet</div>
              )}
            </div>
          ))}
        </div>
      )}


      {/* ─────────────────────────── TAB: QUESTIONS ─────────────────────────── */}
      {activeTab === 'questions' && (
        <div className="card-feature-light overflow-hidden space-y-4">
          <div className="p-4 bg-[#141414] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#3ecf8e]" />
              <span className="text-xs font-semibold text-white">Active Question Bank ({questions.length})</span>
            </div>
            <button
              onClick={() => setIsAddQuestionOpen(true)}
              className="btn-primary-green text-xs px-3.5 py-1.5 font-semibold flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Add New Question
            </button>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
            {questions.map((q, idx) => {
              const isCustom = q.id.startsWith('custom_') || q.id.startsWith('q_custom_');
              return (
                <div key={q.id || idx} className="p-4 rounded-xl bg-[#141414] border border-white/[0.06] space-y-2 hover:border-white/[0.12] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const TopicIcon = TOPIC_META[q.topic]?.icon;
                        return (
                          <span className="text-xs font-mono font-bold text-[#3ecf8e] uppercase flex items-center gap-1">
                            {TopicIcon && <TopicIcon className="w-3 h-3" />}
                            <span>{q.topic}</span>
                          </span>
                        );
                      })()}
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${tierStyle(q.difficulty, false)}`}>
                        {q.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isCustom ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          Teacher Created
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#52525b] font-mono">Seed</span>
                      )}

                      {/* Edit Question Button */}
                      <button
                        onClick={() => {
                          setEditingQuestion(q);
                          setIsAddQuestionOpen(true);
                        }}
                        title="Edit Question"
                        className="p-1 rounded-lg text-[#9ca3af] hover:text-white hover:bg-white/[0.08] transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#3ecf8e]" />
                      </button>

                      {/* Delete Question Button */}
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        disabled={deletingQuestionId === q.id}
                        title="Delete Question"
                        className="p-1 rounded-lg text-[#9ca3af] hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-white leading-snug">{q.questionText}</p>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-1.5 rounded-lg border text-[11px] font-mono flex items-center gap-1.5 ${
                          oIdx === q.correctAnswerIndex
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold'
                            : 'bg-[#1c1c1c] border-white/[0.04] text-[#9ca3af]'
                        }`}
                      >
                        <span className="opacity-60">{String.fromCharCode(65 + oIdx)}.</span>
                        <span className="truncate">{opt}</span>
                        {oIdx === q.correctAnswerIndex && <span className="ml-auto text-emerald-400">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ADD / EDIT QUESTION MODAL ── */}
      <AddQuestionModal
        isOpen={isAddQuestionOpen}
        initialQuestion={editingQuestion}
        onClose={() => {
          setIsAddQuestionOpen(false);
          setEditingQuestion(null);
        }}
        onQuestionAdded={(savedQ) => {
          setQuestions(prev => {
            const idx = prev.findIndex(item => item.id === savedQ.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = savedQ;
              return copy;
            }
            return [...prev, savedQ];
          });
        }}
      />

      {/* ─────────────────────────── STUDENT MODAL ──────────────────────────── */}
      {selectedStudent && (() => {
        const sid          = selectedStudent.id;
        const studentAtts  = sortedAttempts.filter(a => a.studentId === sid);
        const acc          = getOverallAcc(sid);
        const badges       = new Set<string>();
        TOPICS.forEach(t => getProgress(sid, t)?.badges?.forEach(b => badges.add(b)));

        return (
          <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
            onClick={e => { if (e.target === e.currentTarget) setSelectedStudent(null); }}>
            <div className="card-feature-light w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">

              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold border ${
                    isStuckAny(sid)
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : 'bg-[#3ecf8e]/10 border-[#3ecf8e]/25 text-[#3ecf8e]'
                  }`}>
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {selectedStudent.name}
                      {isStuckAny(sid) && <span className="text-xs text-rose-400 font-normal">⚠ needs support</span>}
                    </h3>
                    <p className="text-[11px] text-[#52525b]">{selectedStudent.email || sid} · {studentAtts.length} attempts · {acc > 0 ? `${acc}% avg` : 'no data'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStudent(null)}
                  className="p-2 rounded-lg text-[#52525b] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Topic grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TOPICS.map(t => {
                    const prog   = getProgress(sid, t);
                    const tStuck = isStuckInTopic(sid, t);
                    return (
                      <div key={t} className={`p-3 rounded-xl border text-center space-y-1 ${
                        tStuck ? 'bg-rose-500/10 border-rose-500/25' : 'bg-[#1c1c1c] border-white/[0.06]'
                      }`}>
                        <span className="text-[10px] font-semibold text-[#52525b] uppercase tracking-wider block">{t}</span>
                        <span className="text-sm font-bold text-white uppercase block">{prog?.currentTier ?? '—'}</span>
                        <span className={`text-[11px] block font-mono ${prog ? (tStuck ? 'text-rose-400' : 'text-[#3ecf8e]') : 'text-[#3f3f46]'}`}>
                          {prog ? `${prog.rollingAccuracy}%` : 'no data'}
                        </span>
                        {prog && (
                          <div className="text-[10px] text-[#52525b]">{prog.totalAttempts} q's</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Badges */}
                <div className="p-4 rounded-xl bg-[#1c1c1c] border border-white/[0.06] space-y-2">
                  <h4 className="text-[11px] font-semibold text-[#52525b] uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" /> Earned Badges
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {badges.size > 0
                      ? Array.from(badges).map(id => {
                          const def = BADGE_DEFINITIONS[id];
                          return (
                            <span key={id} className="px-2.5 py-1 rounded-full bg-[#141414] border border-white/[0.06] text-xs text-white flex items-center gap-1">
                              {def?.icon ?? '🏆'} <span className="capitalize">{def?.name ?? id.replace(/_/g, ' ')}</span>
                            </span>
                          );
                        })
                      : <span className="text-xs text-[#52525b]">No badges earned yet</span>
                    }
                  </div>
                </div>

                {/* Attempt history */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold text-[#52525b] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#3ecf8e]" /> Recent Attempts
                    <span className="ml-auto text-[#3f3f46] font-normal normal-case">showing last {Math.min(10, studentAtts.length)} of {studentAtts.length}</span>
                  </h4>
                  {studentAtts.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#141414] border border-white/[0.04] text-center text-xs text-[#52525b]">
                      No quiz attempts logged yet.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {studentAtts.slice(0, 10).map(a => (
                        <div key={a.id} className="px-3 py-2.5 rounded-xl bg-[#141414] border border-white/[0.04] flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {a.isCorrect
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              : <XCircle     className="w-4 h-4 text-rose-400    shrink-0" />}
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-white capitalize">{a.topic}</div>
                              <div className="text-[10px] text-[#52525b] uppercase">{a.difficulty} tier</div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-mono text-white">{(a.responseTimeMs / 1000).toFixed(1)}s</div>
                            <div className="text-[10px] text-[#52525b]">{relativeTime(a.timestamp)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
