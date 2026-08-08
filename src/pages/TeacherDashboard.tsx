import React, { useState, useEffect } from 'react';
import { 
  Users, AlertTriangle, RefreshCw, Database, BarChart3,
  CheckCircle2, XCircle, Clock, Search, X, ChevronRight,
  ShieldCheck, Award, TrendingUp, Activity
} from 'lucide-react';
import type { StudentProgress, User, MathTopic, Attempt } from '../types/schema';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { SEED_STUDENTS, INITIAL_PROGRESS, seedFirestoreData } from '../services/seedService';

const TOPICS: MathTopic[] = ['fractions', 'ratios', 'geometry', 'decimals'];

export const TeacherDashboard: React.FC = () => {
  const [students] = useState<User[]>(SEED_STUDENTS);
  const [progressList, setProgressList]   = useState<StudentProgress[]>(INITIAL_PROGRESS);
  const [attemptsList, setAttemptsList]   = useState<Attempt[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [searchQuery, setSearchQuery]     = useState<string>('');
  const [isRefreshing, setIsRefreshing]   = useState<boolean>(false);

  useEffect(() => {
    loadLocalData();

    let unsubProgress: () => void = () => {};
    let unsubAttempts: () => void = () => {};

    if (navigator.onLine) {
      try {
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
      } catch (err) { console.warn('Firestore listener error:', err); }
    }

    const onStorage = () => loadLocalData();
    window.addEventListener('storage', onStorage);
    return () => { unsubProgress(); unsubAttempts(); window.removeEventListener('storage', onStorage); };
  }, []);

  const loadLocalData = () => {
    try {
      const p = localStorage.getItem('shiksha_progress');
      if (p) setProgressList(JSON.parse(p));
      const a = localStorage.getItem('shiksha_attempts');
      if (a) setAttemptsList(JSON.parse(a));
    } catch (e) { console.error(e); }
  };

  const handleRefresh = () => { setIsRefreshing(true); loadLocalData(); setTimeout(() => setIsRefreshing(false), 500); };

  const handleSeedDB = async () => {
    setIsRefreshing(true);
    const ok = await seedFirestoreData();
    loadLocalData();
    setIsRefreshing(false);
    alert(ok ? '✅ Firestore seeded: 32 questions + 5 student profiles!' : '⚠️ Offline — seeded local cache instead.');
  };

  const getProgress = (studentId: string, topic: MathTopic) =>
    progressList.find((p) => p.studentId === studentId && p.topic === topic);

  const stuckStudents = students.flatMap((student) =>
    TOPICS.flatMap((topic) => {
      const prog = getProgress(student.id, topic);
      if (!prog) return [];
      const last2 = prog.rollingHistory.slice(-2);
      const stuck = (last2.length >= 2 && last2.every((r) => !r)) || (prog.totalAttempts >= 3 && prog.rollingAccuracy < 40);
      if (!stuck) return [];
      const reason = last2.length >= 2 && last2.every((r) => !r)
        ? `2 consecutive wrong at ${prog.currentTier.toUpperCase()}`
        : `${prog.rollingAccuracy}% accuracy`;
      return [{ student, topic, progress: prog, reason }];
    })
  );

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgAccuracy = progressList.length
    ? Math.round(progressList.reduce((sum, p) => sum + p.rollingAccuracy, 0) / progressList.length)
    : 0;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="badge-emerald">Grade 6 Math</span>
            <span className="text-xs text-[#52525b]">Teacher Analytics Workspace</span>
          </div>
          <h1 className="text-2xl font-medium text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#3ecf8e]" /> Class Analytics
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleSeedDB} className="btn-secondary-outline text-xs px-3 py-2 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#3ecf8e]" /> Seed DB
          </button>
          <button onClick={handleRefresh} className="btn-primary-green text-xs px-3 py-2 flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Sync Live
          </button>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Students', value: students.length, sub: 'Section A', icon: <Users className="w-4 h-4" />, color: 'text-[#3ecf8e]' },
          { label: 'Stuck Alerts', value: stuckStudents.length, sub: 'Need intervention', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-rose-400' },
          { label: 'Total Attempts', value: attemptsList.length, sub: 'Logged & synced', icon: <Activity className="w-4 h-4" />, color: 'text-purple-400' },
          { label: 'Avg. Accuracy', value: `${avgAccuracy}%`, sub: 'Rolling window', icon: <TrendingUp className="w-4 h-4" />, color: 'text-amber-400' },
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

      {/* ── EARLY WARNING ── */}
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
              <p className="text-xs text-[#52525b]">Students flagged with consecutive wrong answers or below 40% accuracy</p>
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

      {/* ── HEATMAP TABLE ── */}
      <div className="card-feature-light overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#3ecf8e]" /> Class Accuracy Heatmap
            </h2>
            <p className="text-xs text-[#52525b] mt-0.5">
              Color-coded per topic: <span className="text-emerald-400">■ Hard/High</span> · <span className="text-amber-400">■ Medium</span> · <span className="text-rose-400">■ Easy/Stuck</span>
            </p>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#52525b] absolute left-2.5 top-2.5" />
            <input type="text" placeholder="Search student..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#1c1c1c] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#3ecf8e]/50 w-52 transition-colors" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="py-3 px-5 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">Student</th>
                {TOPICS.map((t) => (
                  <th key={t} className="py-3 px-4 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider text-center capitalize">{t}</th>
                ))}
                <th className="py-3 px-4 text-[11px] font-semibold text-[#52525b] uppercase tracking-wider text-right">Log</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} onClick={() => setSelectedStudent(student)}
                  className="border-b border-white/[0.04] hover:bg-[#141414] cursor-pointer transition-colors group">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 flex items-center justify-center text-xs font-bold text-[#3ecf8e] shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-[#3ecf8e] transition-colors">{student.name}</div>
                        <div className="text-[11px] text-[#52525b]">{student.id}</div>
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
                    const stuck = last2.length >= 2 && last2.every((r) => !r);
                    const style = stuck || prog.rollingAccuracy < 40
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : prog.currentTier === 'hard'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/25';
                    return (
                      <td key={topic} className="py-3.5 px-4 text-center">
                        <div className={`inline-flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${style}`}>
                          <span className="uppercase tracking-wider">{prog.currentTier}</span>
                          <span className="text-[10px] opacity-75 font-normal">{prog.rollingAccuracy}%</span>
                        </div>
                      </td>
                    );
                  })}

                  <td className="py-3.5 px-4 text-right">
                    <span className="text-xs text-[#3ecf8e] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 justify-end">
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── STUDENT DETAIL MODAL ── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="card-feature-light w-full max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin animate-scale-in">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/25 flex items-center justify-center text-base font-bold text-[#3ecf8e]">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedStudent.name}</h3>
                  <p className="text-xs text-[#52525b]">Student Performance Report</p>
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
                      <span className="text-xs text-[#3ecf8e] block">{prog ? `${prog.rollingAccuracy}%` : 'No data'}</span>
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
                    return arr.length ? arr.map((id) => (
                      <span key={id} className="px-2.5 py-1 rounded-full bg-[#141414] border border-white/[0.06] text-xs text-white flex items-center gap-1">
                        🏆 <span className="capitalize">{id.replace(/_/g, ' ')}</span>
                      </span>
                    )) : <span className="text-xs text-[#52525b]">No badges yet</span>;
                  })()}
                </div>
              </div>

              {/* Attempt History */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-semibold text-[#52525b] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#3ecf8e]" /> Recent Attempts
                </h4>

                {attemptsList.filter((a) => a.studentId === selectedStudent.id).length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#141414] border border-white/[0.04] text-center text-xs text-[#52525b]">
                    No attempts logged yet — start a quiz session first
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
                                {attempt.topic} — Q{attempt.questionId.slice(-4)}
                              </div>
                              <div className="text-[11px] text-[#52525b] uppercase">{attempt.difficulty}</div>
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
            <div className="border-t border-white/[0.06] px-6 py-3 bg-[#141414] flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3ecf8e]" />
              <span className="text-[11px] text-[#52525b]">Data synced from Firestore realtime listener</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
