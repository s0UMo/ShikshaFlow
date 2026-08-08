import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, ArrowRight, 
  Sparkles, Trophy, Clock, BrainCircuit
} from 'lucide-react';
import type { Question, MathTopic, DifficultyTier, StudentProgress, Attempt } from '../types/schema';
import { SEED_QUESTIONS } from '../data/seedQuestions';
import { evaluateAdaptiveStep } from '../engine/adaptiveEngine';
import { db } from '../services/firebase';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { queueAttemptOffline, syncOfflineQueueToFirestore } from '../services/offlineDb';

export const StudentQuiz: React.FC = () => {
  // Active student user from session
  const currentUserRaw = localStorage.getItem('shiksha_user');
  const user = currentUserRaw ? JSON.parse(currentUserRaw) : { id: 'student-1', name: 'Rohan Sharma', role: 'student' };

  // Quiz state
  const [selectedTopic, setSelectedTopic] = useState<MathTopic>('fractions');
  const [currentTier, setCurrentTier] = useState<DifficultyTier>('easy');
  const [rollingHistory, setRollingHistory] = useState<boolean[]>([]);
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [tierMessage, setTierMessage] = useState<string | null>(null);

  const [startTime, setStartTime] = useState<number>(Date.now());
  const [lastResponseTimeMs, setLastResponseTimeMs] = useState<number>(0);
  const [totalAttemptCount, setTotalAttemptCount] = useState<number>(0);

  // Load progress and initial question
  useEffect(() => {
    loadTopicProgress(selectedTopic);
  }, [selectedTopic]);

  const loadTopicProgress = (topic: MathTopic) => {
    // Check localStorage fallback progress
    const progressRaw = localStorage.getItem('shiksha_progress');
    let savedProgressList: StudentProgress[] = [];
    if (progressRaw) {
      try {
        savedProgressList = JSON.parse(progressRaw);
      } catch (e) {
        console.error('Error parsing saved progress', e);
      }
    }

    const topicProgress = savedProgressList.find((p) => p.studentId === user.id && p.topic === topic);
    
    const initialTier: DifficultyTier = topicProgress ? topicProgress.currentTier : 'easy';
    const initialHistory = topicProgress ? topicProgress.rollingHistory : [];
    
    setCurrentTier(initialTier);
    setRollingHistory(initialHistory);
    setSelectedOption(null);
    setIsSubmitted(false);
    setTierMessage(null);

    // Pick first question using adaptive engine
    const result = evaluateAdaptiveStep({
      topic,
      currentTier: initialTier,
      rollingHistory: initialHistory,
      availableQuestions: SEED_QUESTIONS,
      answeredQuestionIds: [],
    });

    setCurrentQuestion(result.nextQuestion);
    setStartTime(Date.now());
  };

  const handleTopicChange = (topic: MathTopic) => {
    setSelectedTopic(topic);
  };

  const handleSubmitAnswer = async () => {
    if (selectedOption === null || !currentQuestion) return;

    const endTime = Date.now();
    const durationMs = Math.max(1000, endTime - startTime);
    setLastResponseTimeMs(durationMs);

    const correct = selectedOption === currentQuestion.correctAnswerIndex;
    setIsCorrect(correct);
    setIsSubmitted(true);

    const updatedHistory = [...rollingHistory, correct];
    setRollingHistory(updatedHistory);

    const newAnsweredIds = [...answeredIds, currentQuestion.id];
    setAnsweredIds(newAnsweredIds);
    setTotalAttemptCount((prev) => prev + 1);

    // Evaluate next tier via engine
    const engineResult = evaluateAdaptiveStep({
      topic: selectedTopic,
      currentTier,
      rollingHistory: updatedHistory,
      availableQuestions: SEED_QUESTIONS,
      answeredQuestionIds: newAnsweredIds,
    });

    const nextTier = engineResult.nextTier;
    setCurrentTier(nextTier);

    if (engineResult.promoted) {
      setTierMessage(`🎉 PROMOTED! You advanced to ${nextTier.toUpperCase()} difficulty!`);
    } else if (engineResult.demoted) {
      setTierMessage(`💡 ADJUSTED: Difficulty set to ${nextTier.toUpperCase()} for practice.`);
    } else {
      setTierMessage(null);
    }

    // Persist attempt to Firestore & LocalStorage
    await persistAttempt(currentQuestion, correct, selectedOption, durationMs, nextTier, updatedHistory);
  };

  const persistAttempt = async (
    q: Question, 
    correct: boolean, 
    optionIdx: number, 
    responseTimeMs: number,
    newTier: DifficultyTier,
    updatedHistory: boolean[]
  ) => {
    const attempt: Attempt = {
      id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      studentId: user.id,
      questionId: q.id,
      topic: selectedTopic,
      difficulty: q.difficulty,
      isCorrect: correct,
      selectedAnswerIndex: optionIdx,
      responseTimeMs,
      timestamp: Date.now(),
      synced: navigator.onLine,
    };

    // 1. LocalStorage & IndexedDB Queue Update
    const existingAttemptsRaw = localStorage.getItem('shiksha_attempts');
    const existingAttempts: Attempt[] = existingAttemptsRaw ? JSON.parse(existingAttemptsRaw) : [];
    existingAttempts.push(attempt);
    localStorage.setItem('shiksha_attempts', JSON.stringify(existingAttempts));

    // Queue in IndexedDB for reliable background sync
    await queueAttemptOffline(attempt);

    // Update Progress in LocalStorage
    const existingProgressRaw = localStorage.getItem('shiksha_progress');
    let existingProgressList: StudentProgress[] = existingProgressRaw ? JSON.parse(existingProgressRaw) : [];
    
    const progressIndex = existingProgressList.findIndex(p => p.studentId === user.id && p.topic === selectedTopic);
    const correctCount = updatedHistory.filter(Boolean).length;
    const rollingAccuracy = Math.round((correctCount / updatedHistory.length) * 100);

    const updatedProgress: StudentProgress = {
      id: `${user.id}_${selectedTopic}`,
      studentId: user.id,
      topic: selectedTopic,
      currentTier: newTier,
      rollingHistory: updatedHistory.slice(-5), // Keep last 5
      rollingAccuracy,
      totalAttempts: (progressIndex >= 0 ? existingProgressList[progressIndex].totalAttempts : 0) + 1,
      correctCount: (progressIndex >= 0 ? existingProgressList[progressIndex].correctCount : 0) + (correct ? 1 : 0),
      streakCount: correct ? (progressIndex >= 0 ? existingProgressList[progressIndex].streakCount + 1 : 1) : 0,
      badges: progressIndex >= 0 ? existingProgressList[progressIndex].badges : [],
      lastUpdated: Date.now(),
    };

    if (progressIndex >= 0) {
      existingProgressList[progressIndex] = updatedProgress;
    } else {
      existingProgressList.push(updatedProgress);
    }
    localStorage.setItem('shiksha_progress', JSON.stringify(existingProgressList));

    // 2. Firestore Sync (if online)
    if (navigator.onLine) {
      try {
        await addDoc(collection(db, 'attempts'), attempt);
        await setDoc(doc(db, 'studentProgress', updatedProgress.id), updatedProgress);
        // Automatically drain IndexedDB queue upon online write success
        await syncOfflineQueueToFirestore();
      } catch (err) {
        console.warn('Firestore attempt write deferred to IndexedDB offline queue:', err);
      }
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
    setTierMessage(null);

    const engineResult = evaluateAdaptiveStep({
      topic: selectedTopic,
      currentTier,
      rollingHistory,
      availableQuestions: SEED_QUESTIONS,
      answeredQuestionIds: answeredIds,
    });

    setCurrentQuestion(engineResult.nextQuestion);
    setStartTime(Date.now());
  };

  const getTierColor = (tier: DifficultyTier) => {
    switch (tier) {
      case 'easy':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'hard':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* ── Topic Selector Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#141414] border border-white/5 shadow-xl">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-[#3ecf8e]" />
          <span className="text-sm font-semibold text-white">Math Topic:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {(['fractions', 'ratios', 'geometry', 'decimals'] as MathTopic[]).map((topic) => (
            <button
              key={topic}
              onClick={() => handleTopicChange(topic)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                selectedTopic === topic
                  ? 'bg-[#3ecf8e] text-[#0a0a0a] font-semibold shadow-md shadow-[#3ecf8e]/20'
                  : 'text-[#9ca3af] hover:text-white bg-[#1c1c1c] hover:bg-[#242424] border border-white/5'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* ── Adaptive Tier & Student Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
          <span>Student: <strong className="text-white">{user.name}</strong></span>
          <span>•</span>
          <span>Attempts: <strong className="text-white">{totalAttemptCount}</strong></span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#9ca3af]">Adaptive Difficulty:</span>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider border ${getTierColor(currentTier)}`}>
            {currentTier} Tier
          </span>
        </div>
      </div>

      {/* ── Main Question Card ── */}
      {currentQuestion ? (
        <div className="card-feature-light p-6 md:p-8 space-y-6 border border-white/10 relative overflow-hidden">

          {/* Tier Promotion/Demotion Banner Alert */}
          {tierMessage && (
            <div className="p-3 rounded-lg bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 text-[#3ecf8e] text-xs font-semibold flex items-center justify-between animate-slide-down">
              <span>{tierMessage}</span>
              <Sparkles className="w-4 h-4 text-[#3ecf8e]" />
            </div>
          )}

          {/* Question Text Header */}
          <div className="space-y-3 pb-4 border-b border-white/5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#9ca3af]">
                Question #{answeredIds.length + 1}
              </span>
            </div>

            {/* Question Text */}
            <h2 className="text-lg md:text-xl font-medium text-white leading-relaxed">
              {currentQuestion.questionText}
            </h2>

            {/* Hindi Question Translation Preview */}
            <p className="text-xs text-[#3ecf8e]/80 italic">
              हिंदी अनुवाद: {currentQuestion.questionTextHindi}
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === index;
              let optionStyle = 'bg-[#1c1c1c] border-white/10 text-[#ededed] hover:border-[#3ecf8e]/40';

              if (isSubmitted) {
                if (index === currentQuestion.correctAnswerIndex) {
                  optionStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold';
                } else if (isSelected) {
                  optionStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
                } else {
                  optionStyle = 'bg-[#141414] border-white/5 text-[#52525b] opacity-50';
                }
              } else if (isSelected) {
                optionStyle = 'bg-[#3ecf8e]/10 border-[#3ecf8e] text-white font-medium shadow-md shadow-[#3ecf8e]/10';
              }

              return (
                <button
                  key={index}
                  disabled={isSubmitted}
                  onClick={() => setSelectedOption(index)}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${optionStyle}`}
                >
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0 ${
                    isSelected ? 'bg-[#3ecf8e] text-[#0a0a0a]' : 'bg-[#242424] text-[#9ca3af]'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-sm pt-0.5">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Submit / Next Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-white/5">
            {!isSubmitted ? (
              <button
                disabled={selectedOption === null}
                onClick={handleSubmitAnswer}
                className="btn-primary-green text-sm px-6 py-2.5 w-full md:w-auto ml-auto"
              >
                Submit Answer
              </button>
            ) : (
              <div className="w-full flex items-center justify-between gap-4 animate-slide-up">
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Correct!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-rose-400 font-semibold text-sm">
                      <XCircle className="w-5 h-5 text-rose-400" /> Incorrect
                    </span>
                  )}
                  <span className="text-xs text-[#9ca3af] flex items-center gap-1 ml-2">
                    <Clock className="w-3 h-3" /> {(lastResponseTimeMs / 1000).toFixed(1)}s
                  </span>
                </div>

                <button
                  onClick={handleNextQuestion}
                  className="btn-primary-green text-sm px-5 py-2 flex items-center gap-2"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Explanation Card (shown after submission) */}
          {isSubmitted && (
            <div className="p-4 rounded-xl bg-[#141414] border border-white/10 space-y-2 animate-fade-in">
              <h4 className="text-xs font-semibold text-[#3ecf8e] uppercase tracking-wider">Explanation:</h4>
              <p className="text-xs text-[#ededed] leading-relaxed">{currentQuestion.explanation}</p>
              <p className="text-xs text-[#9ca3af] italic">हिंदी स्पष्टीकरण: {currentQuestion.explanationHindi}</p>
            </div>
          )}

        </div>
      ) : (
        <div className="card-feature-light p-12 text-center space-y-4">
          <Trophy className="w-12 h-12 text-[#3ecf8e] mx-auto animate-bounce-soft" />
          <h3 className="text-xl font-bold text-white">Topic Completed!</h3>
          <p className="text-sm text-[#9ca3af]">You answered all questions for {selectedTopic.toUpperCase()}.</p>
          <button
            onClick={() => {
              setAnsweredIds([]);
              loadTopicProgress(selectedTopic);
            }}
            className="btn-primary-green text-xs px-4 py-2"
          >
            Practice Topic Again
          </button>
        </div>
      )}
    </div>
  );
};
