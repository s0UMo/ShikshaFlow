import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, ArrowRight,
  Sparkles, Trophy, Clock, BrainCircuit, Flame, Award
} from 'lucide-react';
import type { Question, MathTopic, DifficultyTier, StudentProgress, Attempt } from '../types/schema';
import { SEED_QUESTIONS } from '../data/seedQuestions';
import { evaluateAdaptiveStep } from '../engine/adaptiveEngine';
import { db } from '../services/firebase';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { queueAttemptOffline, syncOfflineQueueToFirestore } from '../services/offlineDb';
import { checkBadgesToAward, BADGE_DEFINITIONS } from '../services/badgeService';
import type { Badge } from '../services/badgeService';

const TOPICS: MathTopic[] = ['fractions', 'ratios', 'geometry', 'decimals'];

const TOPIC_META: Record<MathTopic, { emoji: string; label: string }> = {
  fractions: { emoji: '½', label: 'Fractions' },
  ratios:    { emoji: '∶', label: 'Ratios' },
  geometry:  { emoji: '△', label: 'Geometry' },
  decimals:  { emoji: '0.', label: 'Decimals' },
};

const TIER_STYLES: Record<DifficultyTier, string> = {
  easy:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  medium: 'bg-amber-500/10  text-amber-400  border-amber-500/20',
  hard:   'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export const StudentQuiz: React.FC = () => {
  const currentUserRaw = localStorage.getItem('shiksha_user');
  const user = currentUserRaw
    ? JSON.parse(currentUserRaw)
    : { id: 'student-1', name: 'Rohan Sharma', role: 'student' };

  const [selectedTopic, setSelectedTopic] = useState<MathTopic>('fractions');
  const [currentTier, setCurrentTier]     = useState<DifficultyTier>('easy');
  const [rollingHistory, setRollingHistory] = useState<boolean[]>([]);
  const [answeredIds, setAnsweredIds]     = useState<string[]>([]);
  const [streakCount, setStreakCount]     = useState<number>(0);
  const [earnedBadges, setEarnedBadges]   = useState<string[]>([]);
  const [sessionCount, setSessionCount]   = useState<number>(0);

  const [currentQuestion, setCurrentQuestion]         = useState<Question | null>(null);
  const [selectedOption, setSelectedOption]           = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted]                 = useState<boolean>(false);
  const [isCorrect, setIsCorrect]                     = useState<boolean>(false);
  const [tierMessage, setTierMessage]                 = useState<string | null>(null);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge]   = useState<Badge | null>(null);
  const [lastResponseTimeMs, setLastResponseTimeMs]   = useState<number>(0);
  const [startTime, setStartTime]                     = useState<number>(Date.now());

  useEffect(() => { loadTopicProgress(selectedTopic); }, [selectedTopic]);

  const loadTopicProgress = (topic: MathTopic) => {
    const progressRaw = localStorage.getItem('shiksha_progress');
    const list: StudentProgress[] = progressRaw ? JSON.parse(progressRaw) : [];
    const prog = list.find((p) => p.studentId === user.id && p.topic === topic);

    const tier = prog?.currentTier ?? 'easy';
    const history = prog?.rollingHistory ?? [];
    const streak = prog?.streakCount ?? 0;
    const badges = prog?.badges ?? [];

    setCurrentTier(tier);
    setRollingHistory(history);
    setStreakCount(streak);
    setEarnedBadges(badges);
    setSelectedOption(null);
    setIsSubmitted(false);
    setTierMessage(null);
    setNewlyUnlockedBadge(null);

    const result = evaluateAdaptiveStep({
      topic, currentTier: tier, rollingHistory: history,
      availableQuestions: SEED_QUESTIONS, answeredQuestionIds: [],
    });
    setCurrentQuestion(result.nextQuestion);
    setStartTime(Date.now());
  };

  const handleSubmitAnswer = async () => {
    if (selectedOption === null || !currentQuestion) return;

    const durationMs = Math.max(1000, Date.now() - startTime);
    setLastResponseTimeMs(durationMs);

    const correct = selectedOption === currentQuestion.correctAnswerIndex;
    setIsCorrect(correct);
    setIsSubmitted(true);

    const updatedHistory = [...rollingHistory, correct];
    setRollingHistory(updatedHistory);

    const newStreak = correct ? streakCount + 1 : 0;
    setStreakCount(newStreak);

    const newAnsweredIds = [...answeredIds, currentQuestion.id];
    setAnsweredIds(newAnsweredIds);
    setSessionCount((c) => c + 1);

    const engineResult = evaluateAdaptiveStep({
      topic: selectedTopic, currentTier, rollingHistory: updatedHistory,
      availableQuestions: SEED_QUESTIONS, answeredQuestionIds: newAnsweredIds,
    });
    const nextTier = engineResult.nextTier;
    setCurrentTier(nextTier);

    const { updatedBadges, newlyAwarded } = checkBadgesToAward(earnedBadges, newStreak, selectedTopic, nextTier);
    setEarnedBadges(updatedBadges);
    if (newlyAwarded.length > 0) setNewlyUnlockedBadge(newlyAwarded[0]);

    if (engineResult.promoted) setTierMessage(`🎉 Level Up! Promoted to ${nextTier.toUpperCase()}`);
    else if (engineResult.demoted) setTierMessage(`💡 Adjusted to ${nextTier.toUpperCase()} for practice`);
    else setTierMessage(null);

    await persistAttempt(currentQuestion, correct, selectedOption, durationMs, nextTier, updatedHistory, newStreak, updatedBadges);
  };

  const persistAttempt = async (
    q: Question, correct: boolean, optionIdx: number,
    responseTimeMs: number, newTier: DifficultyTier,
    updatedHistory: boolean[], newStreak: number, updatedBadges: string[]
  ) => {
    const attempt: Attempt = {
      id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      studentId: user.id, questionId: q.id, topic: selectedTopic,
      difficulty: q.difficulty, isCorrect: correct,
      selectedAnswerIndex: optionIdx, responseTimeMs,
      timestamp: Date.now(), synced: navigator.onLine,
    };

    const existingAttempts: Attempt[] = JSON.parse(localStorage.getItem('shiksha_attempts') || '[]');
    existingAttempts.push(attempt);
    localStorage.setItem('shiksha_attempts', JSON.stringify(existingAttempts));
    await queueAttemptOffline(attempt);

    const progressList: StudentProgress[] = JSON.parse(localStorage.getItem('shiksha_progress') || '[]');
    const idx = progressList.findIndex((p) => p.studentId === user.id && p.topic === selectedTopic);
    const correctCount = updatedHistory.filter(Boolean).length;
    const updatedProgress: StudentProgress = {
      id: `${user.id}_${selectedTopic}`, studentId: user.id, topic: selectedTopic,
      currentTier: newTier, rollingHistory: updatedHistory.slice(-5),
      rollingAccuracy: Math.round((correctCount / updatedHistory.length) * 100),
      totalAttempts: (idx >= 0 ? progressList[idx].totalAttempts : 0) + 1,
      correctCount: (idx >= 0 ? progressList[idx].correctCount : 0) + (correct ? 1 : 0),
      streakCount: newStreak, badges: updatedBadges, lastUpdated: Date.now(),
    };
    if (idx >= 0) progressList[idx] = updatedProgress; else progressList.push(updatedProgress);
    localStorage.setItem('shiksha_progress', JSON.stringify(progressList));

    if (navigator.onLine) {
      try {
        await addDoc(collection(db, 'attempts'), attempt);
        await setDoc(doc(db, 'studentProgress', updatedProgress.id), updatedProgress);
        await syncOfflineQueueToFirestore();
      } catch (err) {
        console.warn('Deferred to IndexedDB queue:', err);
      }
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
    setTierMessage(null);
    setNewlyUnlockedBadge(null);
    const result = evaluateAdaptiveStep({
      topic: selectedTopic, currentTier, rollingHistory,
      availableQuestions: SEED_QUESTIONS, answeredQuestionIds: answeredIds,
    });
    setCurrentQuestion(result.nextQuestion);
    setStartTime(Date.now());
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in pb-16 space-y-5">

      {/* ── TOPIC SELECTOR ── */}
      <div className="card-feature-light p-2 flex items-center gap-1 overflow-x-auto">
        {TOPICS.map((topic) => (
          <button
            key={topic}
            onClick={() => setSelectedTopic(topic)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold flex-1 justify-center transition-all whitespace-nowrap ${
              selectedTopic === topic
                ? 'bg-[#3ecf8e] text-[#0a0a0a] shadow-md shadow-[#3ecf8e]/20'
                : 'text-[#9ca3af] hover:text-white hover:bg-[#1c1c1c]'
            }`}
          >
            <span className="font-mono text-base leading-none">{TOPIC_META[topic].emoji}</span>
            <span>{TOPIC_META[topic].label}</span>
          </button>
        ))}
      </div>

      {/* ── SESSION STATS BAR ── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
            <BrainCircuit className="w-4 h-4 text-[#3ecf8e]" />
            <span className="font-medium text-white">{user.name}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-xs text-[#52525b]">
            <span>{sessionCount} answered this session</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {earnedBadges.length > 0 && (
            <div className="hidden sm:flex items-center gap-1">
              {earnedBadges.slice(0, 4).map((badgeId) => {
                const b = BADGE_DEFINITIONS[badgeId];
                return b ? (
                  <span key={badgeId} title={`${b.name}: ${b.description}`}
                    className="w-6 h-6 rounded-full bg-[#1c1c1c] border border-white/10 flex items-center justify-center text-sm">
                    {b.icon}
                  </span>
                ) : null;
              })}
            </div>
          )}

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${
            streakCount >= 3 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse' : 'bg-[#1c1c1c] text-[#9ca3af] border-white/[0.06]'
          }`}>
            <Flame className={`w-3.5 h-3.5 ${streakCount >= 3 ? 'text-amber-400 fill-amber-400' : 'text-[#52525b]'}`} />
            <span>{streakCount}</span>
          </div>

          <span className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider ${TIER_STYLES[currentTier]}`}>
            {currentTier}
          </span>
        </div>
      </div>

      {/* ── BADGE UNLOCK TOAST ── */}
      {newlyUnlockedBadge && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-500/10 to-pink-500/20 border border-amber-500/40 flex items-center gap-4 animate-scale-in">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
            {newlyUnlockedBadge.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1 mb-0.5">
              <Award className="w-3 h-3" /> Badge Unlocked!
            </div>
            <div className="text-sm font-bold text-white">{newlyUnlockedBadge.name}</div>
            <div className="text-xs text-[#9ca3af] truncate">{newlyUnlockedBadge.description}</div>
          </div>
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" style={{ animation: 'spin-slow 3s linear infinite' }} />
        </div>
      )}

      {/* ── MAIN QUESTION CARD ── */}
      {currentQuestion ? (
        <div className="card-feature-light divide-y divide-white/[0.06]">

          {/* Question Header */}
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#52525b] uppercase tracking-wider">
              <span>Question {answeredIds.length + 1}</span>
              <span className={`px-2 py-0.5 rounded-md border ${TIER_STYLES[currentTier]}`}>
                {currentQuestion.difficulty}
              </span>
            </div>

            {/* Tier/Promotion Banner */}
            {tierMessage && (
              <div className="p-2.5 rounded-lg bg-[#3ecf8e]/10 border border-[#3ecf8e]/25 text-[#3ecf8e] text-xs font-semibold flex items-center gap-2 animate-slide-down">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>{tierMessage}</span>
              </div>
            )}

            <h2 className="text-lg md:text-xl font-medium text-white leading-relaxed">
              {currentQuestion.questionText}
            </h2>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-[#141414] border border-white/[0.06] text-xs text-[#9ca3af]">
              <span className="text-[#3ecf8e] font-bold shrink-0 mt-0.5">हि</span>
              <span className="leading-relaxed">{currentQuestion.questionTextHindi}</span>
            </div>
          </div>

          {/* Options */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isRight = index === currentQuestion.correctAnswerIndex;
              let style = 'bg-[#1c1c1c] border-white/[0.08] text-[#ededed] hover:border-[#3ecf8e]/40 hover:bg-[#242424]';
              if (isSubmitted) {
                if (isRight) style = 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200';
                else if (isSelected) style = 'bg-rose-500/15 border-rose-500/60 text-rose-200';
                else style = 'bg-[#141414] border-white/[0.04] text-[#52525b] opacity-40';
              } else if (isSelected) {
                style = 'bg-[#3ecf8e]/10 border-[#3ecf8e]/60 text-white shadow-sm shadow-[#3ecf8e]/10';
              }

              return (
                <button key={index} disabled={isSubmitted} onClick={() => setSelectedOption(index)}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 text-left transition-all ${style}`}>
                  <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                    isSubmitted && isRight ? 'bg-emerald-500 text-white'
                    : isSubmitted && isSelected ? 'bg-rose-500 text-white'
                    : isSelected ? 'bg-[#3ecf8e] text-[#0a0a0a]'
                    : 'bg-[#242424] text-[#9ca3af]'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-sm leading-snug">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            {!isSubmitted ? (
              <button disabled={selectedOption === null} onClick={handleSubmitAnswer}
                className="btn-primary-green ml-auto px-8 py-2.5 font-semibold text-sm">
                Submit Answer
              </button>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  {isCorrect
                    ? <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold"><CheckCircle2 className="w-5 h-5" /> Correct!</span>
                    : <span className="flex items-center gap-1.5 text-rose-400 text-sm font-semibold"><XCircle className="w-5 h-5" /> Incorrect</span>
                  }
                  <span className="text-[11px] text-[#52525b] flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {(lastResponseTimeMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <button onClick={handleNextQuestion}
                  className="btn-primary-green px-5 py-2.5 flex items-center gap-2 text-sm font-semibold">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Explanation (after submit) */}
          {isSubmitted && (
            <div className="px-6 py-5 space-y-2 bg-[#141414] rounded-b-xl animate-slide-up">
              <h4 className="text-[11px] font-semibold text-[#3ecf8e] uppercase tracking-wider">Explanation</h4>
              <p className="text-xs text-[#ededed] leading-relaxed">{currentQuestion.explanation}</p>
              <p className="text-xs text-[#9ca3af] leading-relaxed italic">
                <strong className="not-italic text-[#3ecf8e]/80">हिंदी:</strong> {currentQuestion.explanationHindi}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="card-feature-light p-16 text-center space-y-4 animate-fade-in">
          <Trophy className="w-12 h-12 text-[#3ecf8e] mx-auto" style={{ animation: 'bounce-soft 2s ease-in-out infinite' }} />
          <h3 className="text-xl font-bold text-white">Topic Complete!</h3>
          <p className="text-sm text-[#9ca3af]">All questions answered for <strong className="text-white capitalize">{selectedTopic}</strong>.</p>
          <button onClick={() => { setAnsweredIds([]); loadTopicProgress(selectedTopic); }}
            className="btn-primary-green px-6 py-2.5 font-semibold">
            Practice Again
          </button>
        </div>
      )}
    </div>
  );
};
