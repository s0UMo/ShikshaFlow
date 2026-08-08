import React, { useState, useEffect } from 'react';
import { 
  Users, AlertTriangle, ChevronRight, RefreshCw, Database,
  BarChart3, CheckCircle2, XCircle, Clock, Search, X
} from 'lucide-react';
import type { StudentProgress, User, MathTopic, Attempt } from '../types/schema';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { SEED_STUDENTS, INITIAL_PROGRESS, seedFirestoreData } from '../services/seedService';

export const TeacherDashboard: React.FC = () => {
  const [students] = useState<User[]>(SEED_STUDENTS);
  const [progressList, setProgressList] = useState<StudentProgress[]>(INITIAL_PROGRESS);
  const [attemptsList, setAttemptsList] = useState<Attempt[]>([]);

  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const topics: MathTopic[] = ['fractions', 'ratios', 'geometry', 'decimals'];

  // Subscribe to Realtime Firestore & LocalStorage for live multi-tab updates
  useEffect(() => {
    loadLocalData();

    // 1. Firestore Realtime Listeners
    let unsubscribeProgress: () => void = () => {};
    let unsubscribeAttempts: () => void = () => {};

    if (navigator.onLine) {
      try {
        unsubscribeProgress = onSnapshot(collection(db, 'studentProgress'), (snapshot) => {
          if (!snapshot.empty) {
            const liveProgress: StudentProgress[] = [];
            snapshot.forEach((doc) => liveProgress.push(doc.data() as StudentProgress));
            if (liveProgress.length > 0) {
              setProgressList(liveProgress);
              localStorage.setItem('shiksha_progress', JSON.stringify(liveProgress));
            }
          }
        });

        unsubscribeAttempts = onSnapshot(collection(db, 'attempts'), (snapshot) => {
          if (!snapshot.empty) {
            const liveAttempts: Attempt[] = [];
            snapshot.forEach((doc) => liveAttempts.push(doc.data() as Attempt));
            if (liveAttempts.length > 0) {
              setAttemptsList(liveAttempts);
              localStorage.setItem('shiksha_attempts', JSON.stringify(liveAttempts));
            }
          }
        });
      } catch (err) {
        console.warn('Firestore realtime snapshot listener deferred to local storage fallback:', err);
      }
    }

    // 2. Storage event listener for multi-tab local updates during offline/demo mode
    const handleStorageChange = () => {
      loadLocalData();
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribeProgress();
      unsubscribeAttempts();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadLocalData = () => {
    const savedProgress = localStorage.getItem('shiksha_progress');
    if (savedProgress) {
      try {
        setProgressList(JSON.parse(savedProgress));
      } catch (e) {
        console.error('Error loading progress:', e);
      }
    }

    const savedAttempts = localStorage.getItem('shiksha_attempts');
    if (savedAttempts) {
      try {
        setAttemptsList(JSON.parse(savedAttempts));
      } catch (e) {
        console.error('Error loading attempts:', e);
      }
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadLocalData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSeedDatabase = async () => {
    setIsRefreshing(true);
    const success = await seedFirestoreData();
    loadLocalData();
    setIsRefreshing(false);
    if (success) {
      alert('🎉 Firestore database seeded successfully with 32 questions and 5 student profiles!');
    } else {
      alert('Offline mode: Seeded local fallback storage!');
    }
  };

  // Find progress for a specific student and topic
  const getProgressForStudent = (studentId: string, topic: MathTopic): StudentProgress | undefined => {
    return progressList.find((p) => p.studentId === studentId && p.topic === topic);
  };

  // Identify "stuck" students (Early Warning System)
  // Rule: Rolling history contains 2+ consecutive wrong answers or accuracy < 40%
  const getStuckStudents = () => {
    const stuckList: { student: User; topic: MathTopic; progress: StudentProgress; reason: string }[] = [];

    students.forEach((student) => {
      topics.forEach((topic) => {
        const prog = getProgressForStudent(student.id, topic);
        if (prog) {
          const last2 = prog.rollingHistory.slice(-2);
          const is2Wrong = last2.length >= 2 && last2.every((res) => res === false);
          const isLowAccuracy = prog.totalAttempts >= 3 && prog.rollingAccuracy < 40;

          if (is2Wrong || isLowAccuracy) {
            stuckList.push({
              student,
              topic,
              progress: prog,
              reason: is2Wrong
                ? `Stuck at ${prog.currentTier.toUpperCase()} tier (2 consecutive wrong answers)`
                : `Low rolling accuracy (${prog.rollingAccuracy}%) in ${topic.toUpperCase()}`,
            });
          }
        }
      });
    });

    return stuckList;
  };

  const stuckStudents = getStuckStudents();

  // Filter students based on search query
  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in pb-16">
      
      {/* ── Page Title & Controls ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-emerald">Grade 6 Math</span>
            <span className="text-xs text-[#9ca3af]">Teacher Analytics Workspace</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-medium tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#3ecf8e]" /> Class Learning Gaps & Heatmap
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedDatabase}
            className="btn-primary-green text-xs px-3.5 py-2 flex items-center gap-1.5"
            title="Push 32 seed questions and student progress to your real Firebase project"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Seed Firestore DB</span>
          </button>

          <button
            onClick={handleManualRefresh}
            className="btn-secondary-outline text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#3ecf8e] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live Data</span>
          </button>
        </div>
      </div>

      {/* ── EARLY WARNING SYSTEM: STUCK STUDENTS HIGHLIGHT ── */}
      <div className="card-feature-light p-6 border-l-4 border-l-rose-500 border-white/10 space-y-4 bg-rose-950/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Early Warning System
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-mono font-bold">
                  {stuckStudents.length} Students Need Attention
                </span>
              </h2>
              <p className="text-xs text-[#9ca3af]">
                Real-time alert for students exhibiting learning gaps or repeated incorrect attempts.
              </p>
            </div>
          </div>
        </div>

        {stuckStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {stuckStudents.map(({ student, topic, progress, reason }, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedStudent(student)}
                className="p-3.5 rounded-xl bg-[#1c1c1c] border border-rose-500/30 hover:border-rose-500/60 cursor-pointer transition-all flex items-start justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{student.name}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {topic}
                    </span>
                  </div>
                  <p className="text-xs text-rose-300/90 flex items-center gap-1">
                    <span>⚠️</span> {reason}
                  </p>
                  <div className="text-[11px] text-[#9ca3af] flex items-center gap-2 pt-1">
                    <span>Tier: <strong className="text-white uppercase">{progress.currentTier}</strong></span>
                    <span>•</span>
                    <span>Accuracy: <strong className="text-rose-400">{progress.rollingAccuracy}%</strong></span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#9ca3af] group-hover:text-rose-400 group-hover:translate-x-1 transition-all mt-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>All students are progressing smoothly! No critical learning bottlenecks detected.</span>
          </div>
        )}
      </div>

      {/* ── CLASS-WIDE HEATMAP MATRIX ── */}
      <div className="card-feature-light p-6 space-y-6 border border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#3ecf8e]" /> Class Accuracy & Tier Heatmap
            </h2>
            <p className="text-xs text-[#9ca3af]">
              Student mastery per topic color-coded by performance (Green = Hard/High, Amber = Medium, Red = Easy/Stuck).
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-[#9ca3af] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#3ecf8e]"
            />
          </div>
        </div>

        {/* Heatmap Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs font-mono uppercase text-[#9ca3af]">
                <th className="py-3 px-4">Student Name</th>
                {topics.map((t) => (
                  <th key={t} className="py-3 px-4 text-center capitalize">{t}</th>
                ))}
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className="hover:bg-[#1c1c1c] transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-4 font-medium text-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 flex items-center justify-center text-xs font-bold text-[#3ecf8e]">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-white group-hover:text-[#3ecf8e] transition-colors">
                        {student.name}
                      </div>
                      <div className="text-[11px] text-[#9ca3af]">ID: {student.id}</div>
                    </div>
                  </td>

                  {topics.map((topic) => {
                    const prog = getProgressForStudent(student.id, topic);
                    
                    if (!prog) {
                      return (
                        <td key={topic} className="py-4 px-4 text-center">
                          <span className="text-xs text-[#52525b] px-2.5 py-1 rounded bg-[#141414] border border-white/5">
                            Unattempted
                          </span>
                        </td>
                      );
                    }

                    const last2 = prog.rollingHistory.slice(-2);
                    const isStuck = last2.length >= 2 && last2.every((res) => res === false);

                    let badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                    if (isStuck || prog.rollingAccuracy < 40) {
                      badgeStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
                    } else if (prog.currentTier === 'medium' || (prog.rollingAccuracy >= 40 && prog.rollingAccuracy < 80)) {
                      badgeStyle = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
                    }

                    return (
                      <td key={topic} className="py-4 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`text-xs px-3 py-1 rounded-md font-semibold border ${badgeStyle}`}>
                            {prog.currentTier.toUpperCase()} • {prog.rollingAccuracy}%
                          </span>
                          <span className="text-[10px] text-[#9ca3af] mt-1">
                            {prog.correctCount}/{prog.totalAttempts} Correct
                          </span>
                        </div>
                      </td>
                    );
                  })}

                  <td className="py-4 px-4 text-right">
                    <button className="text-xs text-[#3ecf8e] hover:underline inline-flex items-center gap-1 font-medium">
                      View Log <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── STUDENT ATTEMPT HISTORY DRILL-DOWN MODAL ── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="card-feature-light max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 space-y-6 border border-white/10 relative">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-6 right-6 p-1.5 rounded-lg text-[#9ca3af] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 flex items-center justify-center text-lg font-bold text-[#3ecf8e]">
                {selectedStudent.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedStudent.name}</h3>
                <p className="text-xs text-[#9ca3af]">Student Attempt History & Performance Analytics</p>
              </div>
            </div>

            {/* Student Topic Progress Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {topics.map((t) => {
                const prog = getProgressForStudent(selectedStudent.id, t);
                return (
                  <div key={t} className="p-3 rounded-xl bg-[#1c1c1c] border border-white/10 space-y-1">
                    <span className="text-xs capitalize font-semibold text-[#9ca3af] block">{t}</span>
                    <span className="text-sm font-bold text-white uppercase">{prog ? prog.currentTier : 'N/A'}</span>
                    <span className="text-xs text-[#3ecf8e] block font-mono">{prog ? `${prog.rollingAccuracy}% Acc` : 'No data'}</span>
                  </div>
                );
              })}
            </div>

            {/* Badges Earned Row */}
            <div className="p-4 rounded-xl bg-[#141414] border border-white/5 space-y-2">
              <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider block">
                Earned Badges & Achievements
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const allBadges = new Set<string>();
                  topics.forEach(t => {
                    const prog = getProgressForStudent(selectedStudent.id, t);
                    if (prog?.badges) prog.badges.forEach(b => allBadges.add(b));
                  });
                  const badgeArr = Array.from(allBadges);
                  if (badgeArr.length === 0) {
                    return <span className="text-xs text-[#52525b]">No badges unlocked yet</span>;
                  }
                  return badgeArr.map(badgeId => (
                    <span key={badgeId} className="px-2.5 py-1 rounded-full bg-[#1c1c1c] border border-white/10 text-xs text-white flex items-center gap-1.5">
                      <span>🏆</span>
                      <span className="capitalize">{badgeId.replace('_', ' ')}</span>
                    </span>
                  ));
                })()}
              </div>
            </div>

            {/* Attempt Logs List */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#3ecf8e]" /> Recent Attempt History
              </h4>

              {attemptsList.filter((a) => a.studentId === selectedStudent.id).length > 0 ? (
                <div className="space-y-2">
                  {attemptsList
                    .filter((a) => a.studentId === selectedStudent.id)
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 10)
                    .map((attempt) => (
                      <div
                        key={attempt.id}
                        className="p-3 rounded-xl bg-[#141414] border border-white/5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          {attempt.isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                          <div>
                            <div className="font-semibold text-white capitalize">
                              Topic: {attempt.topic} • Question ID: {attempt.questionId}
                            </div>
                            <div className="text-[11px] text-[#9ca3af]">
                              Difficulty: <span className="uppercase text-white font-mono">{attempt.difficulty}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-white block">{(attempt.responseTimeMs / 1000).toFixed(1)}s</span>
                          <span className="text-[10px] text-[#9ca3af]">
                            {new Date(attempt.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#141414] text-center text-xs text-[#9ca3af]">
                  No attempt logs recorded for this student yet. Start a quiz session in Student view to populate attempts!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
