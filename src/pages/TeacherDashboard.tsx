import React, { useState, useEffect } from 'react';
import { 
  Users, AlertTriangle, RefreshCw, BarChart3,
  CheckCircle2, XCircle, Clock, Search, X, ChevronRight,
  ShieldCheck, Award, TrendingUp, Activity, Filter, ArrowUpDown,
  Sparkles
} from 'lucide-react';
import type { StudentProgress, User, MathTopic, Attempt } from '../types/schema';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { BADGE_DEFINITIONS } from '../services/badgeService';

const TOPICS: MathTopic[] = ['fractions', 'ratios', 'geometry', 'decimals'];

const TOPIC_META: Record<MathTopic, { emoji: string; label: string }> = {
  fractions: { emoji: '½', label: 'Fractions' },
  ratios:    { emoji: '∶', label: 'Ratios' },
  geometry:  { emoji: '△', label: 'Geometry' },
  decimals:  { emoji: '0.', label: 'Decimals' },
};

type SortField = 'name' | 'accuracy' | 'attempts' | 'stuck';
type FilterStatus = 'all' | 'stuck' | 'hard' | 'medium' | 'easy';

export const TeacherDashboard: React.FC = () => {
  const [students, setStudents]           = useState<User[]>([]);
  const [progressList, setProgressList]   = useState<StudentProgress[]>([]);
  const [attemptsList, setAttemptsList]   = useState<Attempt[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  
  // Dynamic controls state
  const [searchQuery, setSearchQuery]     = useState<string>('');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<MathTopic | 'all'>('all');
  const [statusFilter, setStatusFilter]   = useState<FilterStatus>('all');
  const [sortBy, setSortBy]               = useState<SortField>('name');
  const [sortOrder, setSortOrder]         = useState<'asc' | 'desc'>('asc');
  const [isRefreshing, setIsRefreshing]   = useState<boolean>(false);
  const [activeTab, setActiveTab]         = useState<'heatmap' | 'activity' | 'topics'>('heatmap');

  useEffect(() => {
    loadLocalData();

    let unsubStudents: () => void = () => {};
    let unsubProgress: () => void = () => {};
    let unsubAttempts: () => void = () => {};

    if (navigator.onLine) {
      try {
        unsubStudents = onSnapshot(collection(db, 'users'), (snap) => {
          const data = snap.docs
            .map((d) => d.data() as User)
            .filter((u) => u.role === 'student');
          if (data.length > 0) {
            setStudents(data);
            localStorage.setItem('shiksha_students', JSON.stringify(data));
          }
        });
        unsubProgress = onSnapshot(collection(db, 'studentProgress'), (snap) => {
          if (!snap.empty) {
            const data = snap.docs.map((d) => d.data() as StudentProgress);
            setProgressList(data);
            localStorage.setItem('shiksha_progress', JSON.stringify(data));
          }
        });
        unsubAttempts = onSnapshot(collection(db, 'attempts'), (snap) => {
          if (!snap.empty) {
            const data = snap.docs.map((d) => d.data() as Attempt);
            setAttemptsList(data);
            localStorage.setItem('shiksha_attempts', JSON.stringify(data));
          }
        });
      } catch (err) { console.warn('Firestore listener warning:', err); }
    }

    const onStorage = () => loadLocalData();
    window.addEventListener('storage', onStorage);
    return () => { unsubStudents(); unsubProgress(); unsubAttempts(); window.removeEventListener('storage', onStorage); };
  }, []);

  const loadLocalData = () => {
    try {
      const s = localStorage.getItem('shiksha_students');
      if (s) { const parsed: User[] = JSON.parse(s); setStudents(parsed.filter(u => u.role === 'student')); }
      const p = localStorage.getItem('shiksha_progress');
      if (p) setProgressList(JSON.parse(p));
      const a = localStorage.getItem('shiksha_attempts');
      if (a) setAttemptsList(JSON.parse(a));
    } catch (e) { console.error(e); }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadLocalData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getProgress = (studentId: string, topic: MathTopic) =>
    progressList.find((p) => p.studentId === studentId && p.topic === topic);

  const getStudentOverallAccuracy = (studentId: string) => {
    const studentProgs = progressList.filter((p) => p.studentId === studentId);
    if (!studentProgs.length) return 0;
    return Math.round(studentProgs.reduce((sum, p) => sum + p.rollingAccuracy, 0) / studentProgs.length);
  };

  const getStudentTotalAttempts = (studentId: string) => {
    return attemptsList.filter((a) => a.studentId === studentId).length;
  };

  const isStudentStuckInTopic = (studentId: string, topic: MathTopic) => {
    const prog = getProgress(studentId, topic);
    if (!prog) return false;
    const last2 = prog.rollingHistory.slice(-2);
    return (last2.length >= 2 && last2.every((r) => !r)) || (prog.totalAttempts >= 3 && prog.rollingAccuracy < 40);
  };

  const isStudentStuckAny = (studentId: string) => {
    return TOPICS.some((t) => isStudentStuckInTopic(studentId, t));
  };

  const stuckStudents = students.flatMap((student) =>
    TOPICS.flatMap((topic) => {
      const prog = getProgress(student.id, topic);
      if (!prog) return [];
      if (!isStudentStuckInTopic(student.id, topic)) return [];
      const last2 = prog.rollingHistory.slice(-2);
      const reason = last2.length >= 2 && last2.every((r) => !r)
        ? `2 consecutive wrong at ${prog.currentTier.toUpperCase()}`
        : `${prog.rollingAccuracy}% accuracy`;
      return [{ student, topic, progress: prog, reason }];
    })
  );

  // Filter & Sort Logic
  const filteredStudents = students
    .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((s) => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'stuck') return isStudentStuckAny(s.id);
      
      if (selectedTopicFilter === 'all') {
        const progs = progressList.filter((p) => p.studentId === s.id);
        return progs.some((p) => p.currentTier === statusFilter);
      } else {
        const prog = getProgress(s.id, selectedTopicFilter);
        return prog?.currentTier === statusFilter;
      }
    })
    .sort((a, b) => {
      let comp = 0;
      if (sortBy === 'name') {
        comp = a.name.localeCompare(b.name);
      } else if (sortBy === 'accuracy') {
        comp = getStudentOverallAccuracy(a.id) - getStudentOverallAccuracy(b.id);
      } else if (sortBy === 'attempts') {
        comp = getStudentTotalAttempts(a.id) - getStudentTotalAttempts(b.id);
      } else if (sortBy === 'stuck') {
        comp = (isStudentStuckAny(b.id) ? 1 : 0) - (isStudentStuckAny(a.id) ? 1 : 0);
      }
      return sortOrder === 'asc' ? comp : -comp;
    });

  const avgAccuracy = progressList.length
    ? Math.round(progressList.reduce((sum, p) => sum + p.rollingAccuracy, 0) / progressList.length)
    : 0;

  // Topic mastery stats
  const topicStats = TOPICS.map((topic) => {
    const progs = progressList.filter((p) => p.topic === topic);
    const hardCount   = progs.filter((p) => p.currentTier === 'hard').length;
    const mediumCount = progs.filter((p) => p.currentTier === 'medium').length;
    const easyCount   = progs.filter((p) => p.currentTier === 'easy').length;
    const avgAcc      = progs.length ? Math.round(progs.reduce((s, p) => s + p.rollingAccuracy, 0) / progs.length) : 0;

    return { topic, hardCount, mediumCount, easyCount, avgAcc, totalProgs: progs.length };
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="badge-emerald">Grade 6 Math</span>
            <span className="text-xs text-[#52525b]">Realtime Analytics Workspace</span>
          </div>
          <h1 className="text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#3ecf8e]" /> Class Analytics Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="btn-primary-green text-xs px-3.5 py-2 flex items-center gap-1.5 font-semibold">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* ── DYNAMIC STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Students', value: students.length || '0', sub: `${filteredStudents.length} shown`, icon: <Users className="w-4 h-4" />, color: 'text-[#3ecf8e]' },
          { label: 'Needs Support', value: stuckStudents.length || '0', sub: 'Low accuracy / stuck', icon: <AlertTriangle className="w-4 h-4" />, color: stuckStudents.length > 0 ? 'text-rose-400' : 'text-[#52525b]' },
          { label: 'Total Attempts', value: attemptsList.length || '0', sub: 'Realtime logged', icon: <Activity className="w-4 h-4" />, color: 'text-purple-400' },
          { label: 'Avg. Class Accuracy', value: progressList.length ? `${avgAccuracy}%` : '—', sub: 'Rolling accuracy window', icon: <TrendingUp className="w-4 h-4" />, color: 'text-amber-400' },
        ].map((card) => (
          <div key={card.label} className="card-feature-light p-4 space-y-2">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${card.color}`}>
              {card.icon}
              <span>{card.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{card.value}</div>
            <div className="text-[11px] text-[#52525b]">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── EARLY WARNING ALERT BAR ── */}
      {stuckStudents.length > 0 && (
        <div className="card-feature-light border-l-4 border-l-rose-500 p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Early Warning System
                <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 text-[11px] font-mono">
                  {stuckStudents.length} action items
                </span>
              </h2>
              <p className="text-xs text-[#52525b]">Students flagged with consecutive incorrect attempts or accuracy &lt; 40%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {stuckStudents.map(({ student, topic, progress, reason }, i) => (
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
                    Tier: <strong className="text-white uppercase">{progress.currentTier}</strong> · {progress.rollingAccuracy}% acc
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#52525b] group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── VIEW TABS ── */}
      <div className="flex border-b border-white/[0.06] space-x-4">
        <button
          onClick={() => setActiveTab('heatmap')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'heatmap'
              ? 'text-[#3ecf8e] border-[#3ecf8e]'
              : 'text-[#9ca3af] border-transparent hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Heatmap & Matrix
        </button>
        <button
          onClick={() => setActiveTab('topics')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'topics'
              ? 'text-[#3ecf8e] border-[#3ecf8e]'
              : 'text-[#9ca3af] border-transparent hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Topic Breakdown
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'activity'
              ? 'text-[#3ecf8e] border-[#3ecf8e]'
              : 'text-[#9ca3af] border-transparent hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" /> Realtime Feed ({attemptsList.length})
        </button>
      </div>

      {/* ── TAB 1: DYNAMIC HEATMAP & MATRIX ── */}
      {activeTab === 'heatmap' && (
        <div className="card-feature-light overflow-hidden space-y-4">

          {/* DYNAMIC FILTER & SEARCH BAR */}
          <div className="p-4 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3 bg-[#141414]">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter by Topic */}
              <div className="flex items-center gap-1 bg-[#1c1c1c] p-1 rounded-lg border border-white/[0.06]">
                <Filter className="w-3.5 h-3.5 text-[#52525b] ml-1.5" />
                <button
                  onClick={() => setSelectedTopicFilter('all')}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                    selectedTopicFilter === 'all' ? 'bg-[#3ecf8e] text-[#0a0a0a] font-semibold' : 'text-[#9ca3af] hover:text-white'
                  }`}
                >
                  All Topics
                </button>
                {TOPICS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTopicFilter(t)}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium capitalize transition-all ${
                      selectedTopicFilter === t ? 'bg-[#3ecf8e] text-[#0a0a0a] font-semibold' : 'text-[#9ca3af] hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                className="bg-[#1c1c1c] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#3ecf8e]/50 cursor-pointer"
              >
                <option value="all">Status: All</option>
                <option value="stuck">⚠️ Needs Support</option>
                <option value="hard">🟢 Hard Tier</option>
                <option value="medium">🟡 Medium Tier</option>
                <option value="easy">🔵 Easy Tier</option>
              </select>

              {/* Sort By */}
              <div className="flex items-center gap-1.5">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortField)}
                  className="bg-[#1c1c1c] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#3ecf8e]/50 cursor-pointer"
                >
                  <option value="name">Sort: Name</option>
                  <option value="accuracy">Sort: Accuracy</option>
                  <option value="attempts">Sort: Attempts</option>
                  <option value="stuck">Sort: Needs Support</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1.5 rounded-lg bg-[#1c1c1c] border border-white/[0.08] text-[#9ca3af] hover:text-white"
                  title="Toggle order"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#52525b] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#1c1c1c] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#3ecf8e]/50 w-48 transition-colors"
              />
            </div>
          </div>

          {/* HEATMAP TABLE */}
          <div className="overflow-x-auto">
            {filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#52525b] space-y-2">
                <Users className="w-8 h-8 mx-auto text-[#3f3f46]" />
                <p>No students match the selected filter criteria.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="py-3 px-5 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Student</th>
                    {TOPICS.map((t) => (
                      <th key={t} className="py-3 px-4 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider text-center capitalize">
                        {TOPIC_META[t].emoji} {t}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider text-center">Avg Acc</th>
                    <th className="py-3 px-4 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider text-right">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const studentAcc = getStudentOverallAccuracy(student.id);
                    const isStuck = isStudentStuckAny(student.id);

                    return (
                      <tr
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={`border-b border-white/[0.04] hover:bg-[#141414] cursor-pointer transition-colors group ${
                          isStuck ? 'bg-rose-500/[0.02]' : ''
                        }`}
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                              isStuck 
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                                : 'bg-[#3ecf8e]/10 border-[#3ecf8e]/20 text-[#3ecf8e]'
                            }`}>
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white group-hover:text-[#3ecf8e] transition-colors flex items-center gap-2">
                                {student.name}
                                {isStuck && <span className="text-[10px] text-rose-400 font-normal font-mono">⚠️ Needs support</span>}
                              </div>
                              <div className="text-[11px] text-[#52525b]">{student.email || student.id}</div>
                            </div>
                          </div>
                        </td>

                        {TOPICS.map((topic) => {
                          const prog = getProgress(student.id, topic);
                          if (!prog) return (
                            <td key={topic} className="py-3.5 px-4 text-center">
                              <span className="text-[11px] text-[#52525b] px-2 py-1 rounded bg-[#1c1c1c] border border-white/[0.04]">—</span>
                            </td>
                          );
                          const last2 = prog.rollingHistory.slice(-2);
                          const stuck = (last2.length >= 2 && last2.every((r) => !r)) || prog.rollingAccuracy < 40;
                          const style = stuck
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : prog.currentTier === 'hard'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : prog.currentTier === 'medium'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                            : 'bg-sky-500/10 text-sky-300 border-sky-500/25';

                          return (
                            <td key={topic} className="py-3.5 px-4 text-center">
                              <div className={`inline-flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${style}`}>
                                <span className="uppercase tracking-wider text-[10px]">{prog.currentTier}</span>
                                <span className="text-[10px] opacity-80 font-normal">{prog.rollingAccuracy}%</span>
                              </div>
                            </td>
                          );
                        })}

                        <td className="py-3.5 px-4 text-center font-mono text-xs text-white">
                          {studentAcc}%
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span className="text-xs text-[#3ecf8e] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 justify-end">
                            View <ChevronRight className="w-3.5 h-3.5" />
                          </span>
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

      {/* ── TAB 2: TOPIC MASTERY BREAKDOWN ── */}
      {activeTab === 'topics' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topicStats.map(({ topic, hardCount, mediumCount, easyCount, avgAcc, totalProgs }) => (
            <div key={topic} className="card-feature-light p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl font-mono">{TOPIC_META[topic].emoji}</span>
                  <div>
                    <h3 className="text-base font-bold text-white capitalize">{topic}</h3>
                    <p className="text-xs text-[#52525b]">{totalProgs} active student records</p>
                  </div>
                </div>
                <span className="text-sm font-mono font-semibold text-[#3ecf8e]">{avgAcc}% avg</span>
              </div>

              {/* Tier Distribution Bars */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#9ca3af]">
                  <span>Tier Distribution</span>
                  <span>{hardCount} Hard · {mediumCount} Medium · {easyCount} Easy</span>
                </div>
                <div className="h-3 rounded-full bg-[#141414] overflow-hidden flex">
                  <div style={{ width: `${totalProgs ? (hardCount / totalProgs) * 100 : 0}%` }} className="bg-emerald-500" title={`Hard: ${hardCount}`} />
                  <div style={{ width: `${totalProgs ? (mediumCount / totalProgs) * 100 : 0}%` }} className="bg-amber-500" title={`Medium: ${mediumCount}`} />
                  <div style={{ width: `${totalProgs ? (easyCount / totalProgs) * 100 : 0}%` }} className="bg-sky-500" title={`Easy: ${easyCount}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 3: REALTIME ACTIVITY FEED ── */}
      {activeTab === 'activity' && (
        <div className="card-feature-light divide-y divide-white/[0.04]">
          <div className="p-4 bg-[#141414] text-xs text-[#9ca3af] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3ecf8e] animate-ping" />
              Live Attempt Log Stream
            </span>
            <span>Showing last {attemptsList.length} recorded attempts</span>
          </div>

          {attemptsList.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#52525b]">
              No live attempts recorded yet.
            </div>
          ) : (
            attemptsList
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 15)
              .map((attempt) => {
                const student = students.find((s) => s.id === attempt.studentId);
                return (
                  <div key={attempt.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[#141414] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      {attempt.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {student?.name || attempt.studentId}
                        </div>
                        <div className="text-[11px] text-[#52525b] capitalize">
                          {attempt.topic} · Tier: <span className="uppercase text-[#ededed]">{attempt.difficulty}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono text-white">{(attempt.responseTimeMs / 1000).toFixed(1)}s</div>
                      <div className="text-[11px] text-[#52525b]">
                        {new Date(attempt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* ── STUDENT DETAIL MODAL ── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="card-feature-light w-full max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin animate-scale-in">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/25 flex items-center justify-center text-base font-bold text-[#3ecf8e]">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedStudent.name}</h3>
                  <p className="text-xs text-[#52525b]">{selectedStudent.email || selectedStudent.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-lg text-[#52525b] hover:text-white hover:bg-white/[0.06] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Topic Progress Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {TOPICS.map((t) => {
                  const prog = getProgress(selectedStudent.id, t);
                  return (
                    <div key={t} className="p-3 rounded-xl bg-[#1c1c1c] border border-white/[0.06] space-y-1 text-center">
                      <span className="text-[11px] font-semibold text-[#52525b] uppercase tracking-wider block">{t}</span>
                      <span className="text-sm font-bold text-white uppercase block">{prog?.currentTier ?? '—'}</span>
                      <span className="text-xs text-[#3ecf8e] block">{prog ? `${prog.rollingAccuracy}% acc` : 'No data'}</span>
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
                  {(() => {
                    const all = new Set<string>();
                    TOPICS.forEach((t) => { getProgress(selectedStudent.id, t)?.badges?.forEach((b) => all.add(b)); });
                    const arr = Array.from(all);
                    return arr.length ? arr.map((id) => {
                      const def = BADGE_DEFINITIONS[id];
                      return (
                        <span key={id} className="px-2.5 py-1 rounded-full bg-[#141414] border border-white/[0.06] text-xs text-white flex items-center gap-1">
                          {def?.icon || '🏆'} <span className="capitalize">{def?.name || id.replace(/_/g, ' ')}</span>
                        </span>
                      );
                    }) : <span className="text-xs text-[#52525b]">No badges earned yet</span>;
                  })()}
                </div>
              </div>

              {/* Attempt History */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-semibold text-[#52525b] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#3ecf8e]" /> Recent Attempt History
                </h4>

                {attemptsList.filter((a) => a.studentId === selectedStudent.id).length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#141414] border border-white/[0.04] text-center text-xs text-[#52525b]">
                    No attempts logged for this student yet.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {attemptsList
                      .filter((a) => a.studentId === selectedStudent.id)
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .slice(0, 8)
                      .map((attempt) => (
                        <div key={attempt.id}
                          className="p-3 rounded-xl bg-[#141414] border border-white/[0.04] flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {attempt.isCorrect
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            }
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-white capitalize truncate">
                                {attempt.topic} — Question #{attempt.questionId}
                              </div>
                              <div className="text-[11px] text-[#52525b] uppercase">{attempt.difficulty} tier</div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-mono text-white">{(attempt.responseTimeMs / 1000).toFixed(1)}s</div>
                            <div className="text-[11px] text-[#52525b]">{new Date(attempt.timestamp).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-white/[0.06] px-6 py-3 bg-[#141414] flex items-center justify-between">
              <span className="text-[11px] text-[#52525b] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3ecf8e]" /> Data synced live via Firestore
              </span>
              <button
                onClick={() => setSelectedStudent(null)}
                className="btn-primary-green text-xs px-3 py-1.5 font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
