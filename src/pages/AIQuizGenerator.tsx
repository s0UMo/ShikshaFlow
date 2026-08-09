import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Bot, Zap, ArrowLeft, RefreshCw,
  Sliders, Brain, Target, BookOpen, ChevronRight
} from 'lucide-react';
import type { MathTopic, DifficultyTier } from '../types/schema';
import { generateAIQuiz } from '../services/aiQuizService';

const PRESETS = [
  {
    id: 'p1',
    title: 'Pizza Party Fractions',
    emoji: '🍕',
    prompt: 'Create real-world word problems about sharing pizzas, pies, and cake slices using fractions.',
    topic: 'fractions' as MathTopic,
    difficulty: 'medium' as DifficultyTier,
  },
  {
    id: 'p2',
    title: 'Speed Ratio Challenge',
    emoji: '🏃',
    prompt: 'Create fast-paced ratio comparison and scaling problems for sports speeds and recipes.',
    topic: 'ratios' as MathTopic,
    difficulty: 'hard' as DifficultyTier,
  },
  {
    id: 'p3',
    title: 'Mystery Shape Geometry',
    emoji: '📐',
    prompt: 'Perimeter and area calculation puzzles for rectangles, squares, and composite shapes.',
    topic: 'geometry' as MathTopic,
    difficulty: 'medium' as DifficultyTier,
  },
  {
    id: 'p4',
    title: 'Shopping Money Decimals',
    emoji: '💰',
    prompt: 'Practical money addition, subtraction, and bill discount calculations with decimals.',
    topic: 'decimals' as MathTopic,
    difficulty: 'easy' as DifficultyTier,
  },
];


const TIER_COLORS: Record<DifficultyTier, string> = {
  easy: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  hard: 'text-[#3ecf8e] bg-[#3ecf8e]/10 border-[#3ecf8e]/30',
};

export const AIQuizGenerator: React.FC = () => {
  const navigate = useNavigate();

  const [prompt, setPrompt]           = useState<string>('');
  const [topic, setTopic]             = useState<MathTopic>('fractions');
  const [difficulty, setDifficulty]   = useState<DifficultyTier>('medium');
  const [count, setCount]             = useState<number>(3);

  const [isGenerating, setIsGenerating]     = useState<boolean>(false);
  const [stepIndex, setStepIndex]           = useState<number>(0);

  const STEPS = [
    'Initializing reasoning engine…',
    'Analyzing topic parameters…',
    'Drafting custom questions…',
    'Translating into regional scripts…',
    'Finalizing answer keys & explanations…',
  ];

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setPrompt(preset.prompt);
    setTopic(preset.topic);
    setDifficulty(preset.difficulty);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    let idx = 0;
    setStepIndex(0);

    const stepInterval = setInterval(() => {
      idx = (idx + 1) % STEPS.length;
      setStepIndex(idx);
    }, 600);

    try {
      const result = await generateAIQuiz({ prompt, topic, difficulty, count });
      clearInterval(stepInterval);

      if (result && result.length > 0) {
        try {
          sessionStorage.setItem('shiksha_ai_quiz_active', 'true');
          sessionStorage.setItem('shiksha_ai_custom_questions', JSON.stringify(result));
        } catch { /* ignore */ }
        navigate('/student/quiz', {
          state: {
            customQuestions: result,
            topic,
            isAI: true
          }
        });
      }
    } catch (err) {
      console.error('AI Generation error:', err);
      clearInterval(stepInterval);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-fade-in pb-16">

      {/* ── BACK NAV ── */}
      <button
        onClick={() => navigate('/student')}
        className="flex items-center gap-1.5 text-xs text-[#9ca3af] hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </button>

      {/* ── HERO ── */}
      <div className="card-feature-light p-6 relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-40 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3ecf8e 0%, transparent 70%)' }} />

        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/20">
              <Bot className="w-5 h-5 text-[#3ecf8e]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-medium tracking-tight text-white">
                AI Quiz Generator
              </h1>
              <p className="text-xs text-[#52525b] mt-0.5">Powered by Groq &middot; Llama 3.3</p>
            </div>
          </div>
          <p className="text-sm text-[#9ca3af] leading-relaxed max-w-lg">
            Generate personalized Math quizzes on any topic. Pick a preset or craft your own prompt.
          </p>
        </div>
      </div>

      {/* ── QUICK PRESETS ── */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#52525b] flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#3ecf8e]" />
          Quick Presets
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PRESETS.map((p) => {
            const isActive = prompt === p.prompt && topic === p.topic;
            return (
              <button
                key={p.id}
                onClick={() => handleApplyPreset(p)}
                className={`card-feature-light p-4 text-left transition-all group hover:-translate-y-0.5 ${
                  isActive ? 'border-[#3ecf8e]/40 shadow-md shadow-[#3ecf8e]/5' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{p.emoji}</span>
                    <span className="text-sm font-semibold text-white">{p.title}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${TIER_COLORS[p.difficulty]}`}>
                    {p.difficulty}
                  </span>
                </div>
                <p className="text-[11px] text-[#52525b] mt-2 line-clamp-2 leading-relaxed">{p.prompt}</p>
                {isActive && (
                  <div className="flex items-center gap-1 mt-2 text-[10px] font-semibold text-[#3ecf8e]">
                    <Sparkles className="w-3 h-3" />
                    Selected
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CONFIGURE ── */}
      <div className="card-feature-light p-6 space-y-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#52525b] flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-[#3ecf8e]" />
          Configure Quiz
        </h2>

        {/* Prompt */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#9ca3af]">Custom Prompt</label>
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Create word problems about fraction addition with recipe ingredients…"
            className="w-full bg-[#1c1c1c] border border-white/[0.08] rounded-lg p-3 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-[#3ecf8e]/60 transition-colors resize-none"
          />
        </div>



        {/* Difficulty & Count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#9ca3af]">Difficulty</label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as DifficultyTier[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                    difficulty === d
                      ? TIER_COLORS[d]
                      : 'bg-[#1c1c1c] text-[#9ca3af] border-white/[0.06] hover:border-white/[0.10] hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#9ca3af]">Questions</label>
            <div className="flex gap-2">
              {[3, 5, 10].map((c) => (
                <button
                  key={c}
                  onClick={() => setCount(c)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    count === c
                      ? 'bg-[#3ecf8e]/10 text-[#3ecf8e] border-[#3ecf8e]/40'
                      : 'bg-[#1c1c1c] text-[#9ca3af] border-white/[0.06] hover:border-white/[0.10] hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary strip */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1c1c1c] border border-white/[0.06] text-xs font-semibold text-[#9ca3af]">
            <BookOpen className="w-3 h-3 text-[#3ecf8e]" />
            {count} questions
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1c1c1c] border border-white/[0.06] text-xs font-semibold text-[#9ca3af] capitalize">
            <Target className="w-3 h-3 text-[#3ecf8e]" />
            {topic}
          </span>
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold capitalize border ${TIER_COLORS[difficulty]}`}>
            {difficulty}
          </span>
        </div>

        {/* Generate */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="btn-primary-green w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate AI Quiz
              <ChevronRight className="w-4 h-4 opacity-60" />
            </>
          )}
        </button>
      </div>

      {/* ── THINKING OVERLAY ── */}
      {isGenerating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)' }}>
          <div className="card-feature-light w-full max-w-sm overflow-hidden animate-scale-in">

            {/* Accent bar */}
            <div className="h-0.5 w-full overflow-hidden bg-[#1c1c1c]">
              <div className="h-full bg-[#3ecf8e]" style={{
                animation: 'overlay-progress 8s ease-in-out forwards',
              }} />
            </div>

            <div className="p-8 space-y-6">

              {/* Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  {/* Outer glow ring */}
                  <div className="absolute -inset-3 rounded-full opacity-20 animate-pulse-glow" />
                  {/* Ring */}
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#3ecf8e]/30 flex items-center justify-center"
                    style={{ animation: 'spin 10s linear infinite' }}>
                    <div className="w-10 h-10 rounded-xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-[#3ecf8e] animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1">
                <h3 className="text-base font-medium text-white tracking-tight">
                  Generating Your Quiz
                </h3>
                <p className="text-[11px] text-[#52525b]">
                  {count} {topic} questions &middot; {difficulty}
                </p>
              </div>

              {/* Step list */}
              <div className="space-y-1.5">
                {STEPS.map((step, i) => {
                  const isDone = i < stepIndex;
                  const isCurrent = i === stepIndex;
                  return (
                    <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-300 ${
                      isCurrent
                        ? 'bg-[#3ecf8e]/5 border border-[#3ecf8e]/20 text-[#3ecf8e]'
                        : isDone
                        ? 'text-[#52525b]'
                        : 'text-[#3f3f46]'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                        isCurrent ? 'bg-[#3ecf8e] shadow-sm shadow-[#3ecf8e]/50' : isDone ? 'bg-[#52525b]' : 'bg-[#3f3f46]'
                      }`} />
                      <span className="font-medium">{step}</span>
                      {isCurrent && (
                        <RefreshCw className="w-3 h-3 animate-spin ml-auto shrink-0 text-[#3ecf8e]/60" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer info */}
              <div className="flex items-center justify-center gap-3 pt-2 border-t border-white/[0.04]">
                <span className="text-[10px] font-mono text-[#3f3f46]">Groq &middot; Llama-3.3 70B</span>
                <span className="w-1 h-1 rounded-full bg-[#3ecf8e] animate-pulse" />
                <span className="text-[10px] font-mono text-[#3ecf8e]/70">ACTIVE</span>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes overlay-progress {
              0% { width: 0%; }
              15% { width: 10%; }
              30% { width: 25%; }
              50% { width: 45%; }
              70% { width: 65%; }
              85% { width: 82%; }
              100% { width: 98%; }
            }
          `}</style>
        </div>
      )}

    </div>
  );
};
