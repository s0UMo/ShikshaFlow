import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CheckCircle2, XCircle, ArrowRight, ArrowLeft,
  Sparkles, Trophy, Clock, BrainCircuit, Flame, X,
  PieChart, Scale, Shapes, Hash
} from 'lucide-react';
import type { Question, MathTopic, DifficultyTier, StudentProgress, Attempt } from '../types/schema';
import { getAllQuestionsLocal, subscribeQuestions } from '../services/questionService';
import { evaluateAdaptiveStep } from '../engine/adaptiveEngine';
import { db } from '../services/firebase';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { queueAttemptOffline, syncOfflineQueueToFirestore } from '../services/offlineDb';
import { checkBadgesToAward } from '../services/badgeService';
import type { Badge } from '../services/badgeService';
import { SUPPORTED_LANGUAGES, getSelectedLanguage } from '../services/i18nService';
import type { LanguageCode } from '../services/i18nService';
import { translateQuestionContent } from '../services/translationEngine';
import { translateTextWithAI } from '../services/aiTranslationService';

// Badge color map: id -> tailwind gradient + glow classes
const BADGE_COLORS: Record<string, { bg: string; border: string; glow: string; text: string }> = {
  streak_3:        { bg: 'from-amber-500/30 to-orange-600/20',   border: 'border-amber-500/50',   glow: 'shadow-amber-500/40',  text: 'text-amber-300' },
  streak_5:        { bg: 'from-purple-500/30 to-pink-600/20',    border: 'border-purple-500/50',  glow: 'shadow-purple-500/40', text: 'text-purple-300' },
  fractions_master:{ bg: 'from-emerald-500/30 to-teal-600/20',  border: 'border-emerald-500/50', glow: 'shadow-emerald-500/40',text: 'text-emerald-300' },
  ratios_master:   { bg: 'from-blue-500/30 to-indigo-600/20',   border: 'border-blue-500/50',    glow: 'shadow-blue-500/40',   text: 'text-blue-300' },
  geometry_master: { bg: 'from-violet-500/30 to-purple-600/20', border: 'border-violet-500/50',  glow: 'shadow-violet-500/40', text: 'text-violet-300' },
  decimals_master: { bg: 'from-cyan-500/30 to-blue-600/20',     border: 'border-cyan-500/50',    glow: 'shadow-cyan-500/40',   text: 'text-cyan-300' },
};


const TOPICS: MathTopic[] = ['fractions', 'ratios', 'geometry', 'decimals'];

const TOPIC_META: Record<MathTopic, { icon: any; label: string }> = {
  fractions: { icon: PieChart, label: 'Fractions' },
  ratios:    { icon: Scale,    label: 'Ratios' },
  geometry:  { icon: Shapes,   label: 'Geometry' },
  decimals:  { icon: Hash,     label: 'Decimals' },
};

const TIER_STYLES: Record<DifficultyTier, string> = {
  easy:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  medium: 'bg-amber-500/10  text-amber-400  border-amber-500/20',
  hard:   'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export const StudentQuiz: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const currentUserRaw = localStorage.getItem('shiksha_user');
  const user = currentUserRaw ? JSON.parse(currentUserRaw) : null;

  // Accept a pre-selected topic from dashboard navigation state
  const initialTopic: MathTopic = (location.state as any)?.topic ?? 'fractions';

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, []);

  if (!user) return null;

  const [selectedTopic, setSelectedTopic] = useState<MathTopic>(initialTopic);
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
  const [toastVisible, setToastVisible]               = useState<boolean>(false);
  const [lastResponseTimeMs, setLastResponseTimeMs]   = useState<number>(0);
  const [startTime, setStartTime]                     = useState<number>(Date.now());
  const toastTimerRef                                 = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if AI custom questions were passed via router state
  const customQuestions: Question[] | undefined = (location.state as any)?.customQuestions;
  const isAIQuiz = Boolean(customQuestions && customQuestions.length > 0);
  const [aiQuestionIndex, setAiQuestionIndex] = useState<number>(0);

  const [allQuestions, setAllQuestions] = useState<Question[]>(getAllQuestionsLocal());
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(getSelectedLanguage());

  useEffect(() => {
    const handleLangChange = () => {
      setSelectedLang(getSelectedLanguage());
    };
    window.addEventListener('shiksha_lang_changed', handleLangChange);
    window.addEventListener('storage', handleLangChange);
    return () => {
      window.removeEventListener('shiksha_lang_changed', handleLangChange);
      window.removeEventListener('storage', handleLangChange);
    };
  }, []);

  const [asyncTranslation, setAsyncTranslation] = useState<{ text: string; explanation: string; options?: string[] } | null>(null);
  const [isTranslatingCurrentQ, setIsTranslatingCurrentQ] = useState<boolean>(false);

  useEffect(() => {
    if (!currentQuestion || selectedLang === 'en') {
      setAsyncTranslation(null);
      setIsTranslatingCurrentQ(false);
      return;
    }

    const localResult = translateQuestionContent(currentQuestion, selectedLang);
    const isTextUntranslated = localResult.text === currentQuestion.questionText;
    const isExpUntranslated = localResult.explanation === currentQuestion.explanation;

    // For non-Hindi languages, options must also be translated via AI if they are not pure math/numbers
    const isOptionsUntranslated = selectedLang !== 'hi' || !localResult.options;

    const targetLangName = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang)?.name || 'Hindi';

    if (isTextUntranslated || isExpUntranslated || isOptionsUntranslated) {
      setIsTranslatingCurrentQ(true);

      const translateOptionsPromise = isOptionsUntranslated
        ? Promise.all(
            currentQuestion.options.map(opt => {
              // Pure math expressions or numbers don't need AI text translation
              if (/^[\d\s\/\+\-\*\=\.\(\)\,]+$/.test(opt.trim())) {
                return Promise.resolve(opt);
              }
              return translateTextWithAI(opt, targetLangName);
            })
          )
        : Promise.resolve(localResult.options || currentQuestion.options);

      Promise.all([
        isTextUntranslated
          ? translateTextWithAI(currentQuestion.questionText, targetLangName)
          : Promise.resolve(localResult.text),
        isExpUntranslated
          ? translateTextWithAI(currentQuestion.explanation, targetLangName)
          : Promise.resolve(localResult.explanation),
        translateOptionsPromise
      ]).then(([text, explanation, options]) => {
        setAsyncTranslation({
          text: text || localResult.text,
          explanation: explanation || localResult.explanation,
          options: options || currentQuestion.options
        });
      }).catch(err => {
        console.warn('AI Translation error in StudentQuiz:', err);
        setAsyncTranslation(localResult);
      }).finally(() => {
        setIsTranslatingCurrentQ(false);
      });
    } else {
      setAsyncTranslation(localResult);
    }
  }, [currentQuestion, selectedLang]);

  const effectiveTranslation = asyncTranslation || (currentQuestion ? translateQuestionContent(currentQuestion, selectedLang) : null);

  useEffect(() => {
    const unsub = subscribeQuestions(setAllQuestions);
    return () => unsub();
  }, []);

  useEffect(() => { loadTopicProgress(selectedTopic); }, [selectedTopic, allQuestions]);

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

    if (isAIQuiz && customQuestions) {
      setCurrentQuestion(customQuestions[0] || null);
      setAiQuestionIndex(0);
    } else {
      const result = evaluateAdaptiveStep({
        topic, currentTier: tier, rollingHistory: history,
        availableQuestions: allQuestions, answeredQuestionIds: [],
      });
      setCurrentQuestion(result.nextQuestion);
    }
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
      availableQuestions: allQuestions, answeredQuestionIds: newAnsweredIds,
    });
    const nextTier = engineResult.nextTier;
    setCurrentTier(nextTier);

    const { updatedBadges, newlyAwarded } = checkBadgesToAward(earnedBadges, newStreak, selectedTopic, nextTier);
    setEarnedBadges(updatedBadges);
    if (newlyAwarded.length > 0) {
      setNewlyUnlockedBadge(newlyAwarded[0]);
      setToastVisible(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToastVisible(false), 4500);
    }

    if (engineResult.promoted) setTierMessage(`🎉 Level Up! Promoted to ${nextTier.toUpperCase()}`);
    else if (engineResult.demoted) setTierMessage(`💡 Adjusted to ${nextTier.toUpperCase()} for practice`);
    else setTierMessage(null);

    const progressList: StudentProgress[] = JSON.parse(localStorage.getItem('shiksha_progress') || '[]');
    const idx = progressList.findIndex((p) => p.studentId === user.id && p.topic === selectedTopic);
    const correctCount = updatedHistory.filter(Boolean).length;
    const attempt: Attempt = {
      id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      studentId: user.id, questionId: currentQuestion.id, topic: selectedTopic,
      difficulty: currentQuestion.difficulty, isCorrect: correct,
      selectedAnswerIndex: selectedOption, responseTimeMs: durationMs,
      timestamp: Date.now(), synced: navigator.onLine,
    };

    const existingAttempts: Attempt[] = JSON.parse(localStorage.getItem('shiksha_attempts') || '[]');
    existingAttempts.push(attempt);
    localStorage.setItem('shiksha_attempts', JSON.stringify(existingAttempts));
    await queueAttemptOffline(attempt);

    const updatedProgress: StudentProgress = {
      id: `${user.id}_${selectedTopic}`, studentId: user.id, topic: selectedTopic,
      currentTier: nextTier, rollingHistory: updatedHistory.slice(-5),
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

    if (isAIQuiz && customQuestions) {
      const nextIdx = aiQuestionIndex + 1;
      if (nextIdx < customQuestions.length) {
        setAiQuestionIndex(nextIdx);
        setCurrentQuestion(customQuestions[nextIdx]);
      } else {
        setCurrentQuestion(null); // End of AI quiz
      }
    } else {
      const result = evaluateAdaptiveStep({
        topic: selectedTopic, currentTier, rollingHistory,
        availableQuestions: allQuestions, answeredQuestionIds: answeredIds,
      });
      setCurrentQuestion(result.nextQuestion);
    }
    setStartTime(Date.now());
  };

  const currentLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in pb-16 space-y-5">

      {/* ── BACK / HEADER ── */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/student')}
          className="flex items-center gap-1.5 text-xs text-[#9ca3af] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          {isAIQuiz && (
            <span className="px-2.5 py-1 rounded-full border bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-300 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" /> AI Generated Quiz
            </span>
          )}
          <span className="text-[11px] text-[#52525b] font-mono">{sessionCount} answered</span>
          <span className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wider ${TIER_STYLES[currentTier]}`}>
            {currentTier}
          </span>
        </div>
      </div>

      {/* ── TOPIC SELECTOR (Only for standard topic quizzes) ── */}
      {!isAIQuiz && (
        <div className="card-feature-light p-2 flex items-center gap-1 overflow-x-auto">
          {TOPICS.map((topic) => {
            const TopicIcon = TOPIC_META[topic].icon;
            return (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold flex-1 justify-center transition-all whitespace-nowrap ${
                  selectedTopic === topic
                    ? 'bg-[#3ecf8e] text-[#0a0a0a] shadow-md shadow-[#3ecf8e]/20'
                    : 'text-[#9ca3af] hover:text-white hover:bg-[#1c1c1c]'
                }`}
              >
                <TopicIcon className="w-4 h-4 shrink-0" />
                <span>{TOPIC_META[topic].label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── STREAK & USER BAR ── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
          <BrainCircuit className="w-4 h-4 text-[#3ecf8e]" />
          <span className="font-medium text-white">{user.name}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${
          streakCount >= 3 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-[#1c1c1c] text-[#9ca3af] border-white/[0.06]'
        }`}>
          <Flame className={`w-3.5 h-3.5 ${streakCount >= 3 ? 'text-amber-400 fill-amber-400' : 'text-[#52525b]'}`} />
          <span>{streakCount} streak</span>
        </div>
      </div>


      {/* ── BADGE UNLOCK FLOATING TOAST ── */}
      {newlyUnlockedBadge && toastVisible && (() => {
        const colors = BADGE_COLORS[newlyUnlockedBadge.id];
        return (
          <div className="fixed top-20 right-4 z-50 max-w-xs w-full animate-slide-down">
            <div className={`relative rounded-2xl border bg-gradient-to-br ${colors.bg} ${colors.border} backdrop-blur-xl shadow-2xl ${colors.glow} overflow-hidden`}>
              {/* Shimmer bar */}
              <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{ animation: 'shimmer 2s linear infinite', backgroundSize: '200% auto' }} />

              <div className="p-4 flex items-center gap-3.5">
                {/* Badge icon with glow */}
                <div className={`relative w-14 h-14 rounded-2xl bg-black/30 border ${colors.border} flex items-center justify-center text-3xl shrink-0`}>
                  {newlyUnlockedBadge.icon}
                  <div className={`absolute inset-0 rounded-2xl opacity-30 blur-md bg-gradient-to-br ${colors.bg}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 flex items-center gap-1 ${colors.text}`}>
                    <span>⬡</span> Achievement Unlocked
                  </div>
                  <div className="text-base font-bold text-white leading-tight">{newlyUnlockedBadge.name}</div>
                  <div className="text-[11px] text-white/60 mt-0.5 leading-snug">{newlyUnlockedBadge.description}</div>
                </div>

                <button onClick={() => setToastVisible(false)}
                  className="shrink-0 p-1 rounded-lg text-white/30 hover:text-white/70 transition-colors self-start">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
              {isTranslatingCurrentQ ? (
                <span className="flex items-center gap-2 text-sm text-[#9ca3af]">
                  <Sparkles className="w-4 h-4 text-[#3ecf8e] animate-spin shrink-0" />
                  <span className="animate-pulse">Translating question into {currentLangInfo.name}…</span>
                </span>
              ) : selectedLang !== 'en' && effectiveTranslation?.text ? (
                effectiveTranslation.text
              ) : (
                currentQuestion.questionText
              )}
            </h2>

            {/* Original English Sub-Badge when translated */}
            {selectedLang !== 'en' && !isTranslatingCurrentQ && (
              <div className="pt-1 flex items-center gap-2 text-xs text-[#71717a]">
                <span className="px-2 py-0.5 rounded bg-[#1c1c1c] border border-white/[0.06] font-mono text-[10px] uppercase text-[#9ca3af]">
                  Original (EN): {currentQuestion.questionText}
                </span>
              </div>
            )}
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
                  <span className="text-sm leading-snug">
                    {effectiveTranslation?.options && effectiveTranslation.options[index]
                      ? effectiveTranslation.options[index]
                      : (selectedLang === 'hi' && currentQuestion.optionsHindi && currentQuestion.optionsHindi[index]
                          ? currentQuestion.optionsHindi[index]
                          : option)}
                  </span>
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
            <div className="border-t border-white/[0.06] animate-slide-up">
              {/* Section header */}
              <div className="flex items-center gap-2 px-6 pt-4 pb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3ecf8e]" />
                <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[#52525b]">Explanation</h4>
                {selectedLang !== 'en' && (
                  <span className="ml-auto badge-emerald">{currentLangInfo.native}</span>
                )}
              </div>

              <div className="px-6 pb-6 space-y-3">
                {/* Translated explanation (primary when language selected) */}
                {selectedLang !== 'en' ? (
                  <>
                    {isTranslatingCurrentQ ? (
                      <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                        <Sparkles className="w-3.5 h-3.5 text-[#3ecf8e] animate-spin shrink-0" />
                        <span className="animate-pulse">Translating explanation…</span>
                      </div>
                    ) : (
                      <p className="text-sm text-[#ededed] leading-relaxed">
                        {effectiveTranslation?.explanation || currentQuestion.explanation}
                      </p>
                    )}
                    {/* English fallback below */}
                    {effectiveTranslation?.explanation && effectiveTranslation.explanation !== currentQuestion.explanation && (
                      <div className="pt-3 border-t border-white/[0.04]">
                        <p className="text-[11px] text-[#52525b] font-semibold uppercase tracking-wider mb-1">English</p>
                        <p className="text-xs text-[#9ca3af] leading-relaxed">{currentQuestion.explanation}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-[#ededed] leading-relaxed">{currentQuestion.explanation}</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card-feature-light p-16 text-center space-y-4 animate-fade-in">
          <Trophy className="w-12 h-12 text-[#3ecf8e] mx-auto" style={{ animation: 'bounce-soft 2s ease-in-out infinite' }} />
          <h3 className="text-xl font-bold text-white">{isAIQuiz ? 'AI Quiz Session Complete!' : 'Topic Complete!'}</h3>
          <p className="text-sm text-[#9ca3af]">
            {isAIQuiz
              ? 'Great job completing your AI-generated practice session!'
              : <>All questions answered for <strong className="text-white capitalize">{selectedTopic}</strong>.</>}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {isAIQuiz ? (
              <button onClick={() => navigate('/student/ai-quiz')} className="btn-primary-green px-6 py-2.5 font-semibold">
                Generate Another AI Quiz
              </button>
            ) : (
              <button onClick={() => { setAnsweredIds([]); loadTopicProgress(selectedTopic); }} className="btn-primary-green px-6 py-2.5 font-semibold">
                Practice Again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
