import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Bot, Zap, ArrowLeft, RefreshCw, 
  CheckCircle2, Sliders, Play, Layers
} from 'lucide-react';
import type { MathTopic, DifficultyTier, Question } from '../types/schema';
import { generateAIQuiz } from '../services/aiQuizService';

const PRESETS = [
  {
    id: 'p1',
    title: '🍕 Pizza Party Fractions',
    prompt: 'Create real-world word problems about sharing pizzas, pies, and cake slices using fractions.',
    topic: 'fractions' as MathTopic,
    difficulty: 'medium' as DifficultyTier,
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300',
  },
  {
    id: 'p2',
    title: '🏃 Speed Ratio Challenge',
    prompt: 'Create fast-paced ratio comparison and scaling problems for sports speeds and recipes.',
    topic: 'ratios' as MathTopic,
    difficulty: 'hard' as DifficultyTier,
    color: 'from-[#3ecf8e]/20 to-teal-500/10 border-[#3ecf8e]/30 text-[#3ecf8e]',
  },
  {
    id: 'p3',
    title: '📐 Mystery Shape Geometry',
    prompt: 'Perimeter and area calculation puzzles for rectangles, squares, and composite shapes.',
    topic: 'geometry' as MathTopic,
    difficulty: 'medium' as DifficultyTier,
    color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-300',
  },
  {
    id: 'p4',
    title: '💰 Shopping Money Decimals',
    prompt: 'Practical money addition, subtraction, and bill discount calculations with decimals.',
    topic: 'decimals' as MathTopic,
    difficulty: 'easy' as DifficultyTier,
    color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-300',
  },
];

const TOPICS: MathTopic[] = ['fractions', 'ratios', 'geometry', 'decimals'];

export const AIQuizGenerator: React.FC = () => {
  const navigate = useNavigate();

  const [prompt, setPrompt]           = useState<string>('');
  const [topic, setTopic]             = useState<MathTopic>('fractions');
  const [difficulty, setDifficulty]   = useState<DifficultyTier>('medium');
  const [count, setCount]             = useState<number>(3);
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[] | null>(null);

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setPrompt(preset.prompt);
    setTopic(preset.topic);
    setDifficulty(preset.difficulty);
    setGeneratedQuestions(null);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedQuestions(null);

    const steps = [
      '🤖 Initializing AI Model...',
      '🔍 Analyzing topic requirements...',
      '✍️ Drafting custom Math problems...',
      '🌐 Translating questions into Hindi...',
      '✨ Finalizing explanations & answer keys...'
    ];

    for (const step of steps) {
      setGenerationStep(step);
      await new Promise((r) => setTimeout(r, 400));
    }

    try {
      const result = await generateAIQuiz({ prompt, topic, difficulty, count });
      setGeneratedQuestions(result);
    } catch (err) {
      console.error('AI Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartQuiz = () => {
    if (!generatedQuestions || generatedQuestions.length === 0) return;
    navigate('/student/quiz', {
      state: {
        customQuestions: generatedQuestions,
        topic,
        isAI: true
      }
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in pb-16">

      {/* ── TOP NAV ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/student')}
          className="flex items-center gap-1.5 text-xs text-[#9ca3af] hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 text-purple-300 text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-purple-500/10">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          PRO FEATURE · AI POWERED
        </div>
      </div>

      {/* ── HERO BANNER ── */}
      <div className="card-feature-light p-6 relative overflow-hidden bg-gradient-to-br from-[#141414] via-[#1c1c1c] to-[#141414]">
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300">
              <Bot className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              AI Custom Quiz Generator
            </h1>
          </div>
          <p className="text-xs md:text-sm text-[#9ca3af] leading-relaxed">
            Generate instant, personalized Grade 6 Math practice quizzes on any topic using AI. Choose a preset or write your own custom prompt!
          </p>
        </div>
      </div>

      {/* ── PRESETS QUICK CHIPS ── */}
      <div className="space-y-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#52525b] flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#3ecf8e]" /> Quick Presets
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p)}
              className={`p-3.5 rounded-xl border bg-[#141414] hover:bg-[#1c1c1c] text-left transition-all flex flex-col justify-between gap-2 group ${p.color}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{p.title}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[#ededed]">
                  {p.topic}
                </span>
              </div>
              <p className="text-[11px] text-[#9ca3af] line-clamp-2 leading-relaxed">{p.prompt}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── CUSTOM PROMPT BUILDER CARD ── */}
      <div className="card-feature-light p-6 space-y-5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#3ecf8e]" /> Customize AI Quiz Parameters
        </h2>

        {/* Custom Prompt Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#9ca3af]">Custom Prompt / Context (Optional)</label>
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Create word problems involving fraction addition with recipe ingredients..."
            className="w-full bg-[#1c1c1c] border border-white/[0.08] rounded-xl p-3 text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#3ecf8e]/60 transition-colors resize-none"
          />
        </div>

        {/* Topic Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#9ca3af]">Topic</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border transition-all ${
                  topic === t
                    ? 'bg-[#3ecf8e] text-[#0a0a0a] border-[#3ecf8e] shadow-md shadow-[#3ecf8e]/20'
                    : 'bg-[#1c1c1c] text-[#9ca3af] border-white/[0.06] hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty & Count Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Difficulty */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#9ca3af]">Difficulty Tier</label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as DifficultyTier[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                    difficulty === d
                      ? d === 'hard'
                        ? 'bg-purple-500 text-white border-purple-400'
                        : d === 'medium'
                        ? 'bg-amber-500 text-[#0a0a0a] border-amber-400'
                        : 'bg-sky-500 text-white border-sky-400'
                      : 'bg-[#1c1c1c] text-[#9ca3af] border-white/[0.06] hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#9ca3af]">Question Count</label>
            <div className="flex gap-2">
              {[3, 5, 10].map((c) => (
                <button
                  key={c}
                  onClick={() => setCount(c)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    count === c
                      ? 'bg-[#3ecf8e]/20 text-[#3ecf8e] border-[#3ecf8e]/50'
                      : 'bg-[#1c1c1c] text-[#9ca3af] border-white/[0.06] hover:text-white'
                  }`}
                >
                  {c} Questions
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="btn-primary-green w-full py-3 text-sm font-bold flex items-center justify-center gap-2 mt-2"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{generationStep}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Quiz</span>
            </>
          )}
        </button>
      </div>

      {/* ── GENERATED QUESTIONS PREVIEW & LAUNCH ── */}
      {generatedQuestions && generatedQuestions.length > 0 && (
        <div className="card-feature-light p-6 space-y-5 border-[#3ecf8e]/40 animate-scale-in">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#3ecf8e]" />
                <h3 className="text-base font-bold text-white">AI Quiz Ready!</h3>
              </div>
              <p className="text-xs text-[#9ca3af] mt-0.5">
                Generated {generatedQuestions.length} custom questions for <strong className="text-white capitalize">{topic}</strong> ({difficulty} tier).
              </p>
            </div>

            <button
              onClick={handleStartQuiz}
              className="btn-primary-green px-6 py-2.5 text-xs font-bold flex items-center gap-2 shadow-lg shadow-[#3ecf8e]/20 animate-bounce-soft"
            >
              <Play className="w-4 h-4 fill-current" /> Start AI Quiz Now
            </button>
          </div>

          {/* Question Previews */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#52525b] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#3ecf8e]" /> Preview Questions
            </h4>
            {generatedQuestions.map((q, idx) => (
              <div key={q.id} className="p-4 rounded-xl bg-[#141414] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#52525b]">
                  <span className="font-mono font-semibold text-[#3ecf8e]">Question #{idx + 1}</span>
                  <span className="uppercase font-mono">{q.difficulty}</span>
                </div>
                <div className="text-xs font-medium text-white">{q.questionText}</div>
                <div className="text-[11px] text-[#9ca3af] italic">हिन्दी: {q.questionTextHindi}</div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] ${
                        oIdx === q.correctAnswerIndex
                          ? 'bg-[#3ecf8e]/10 border-[#3ecf8e]/40 text-[#3ecf8e] font-semibold'
                          : 'bg-[#1c1c1c] border-white/[0.04] text-[#9ca3af]'
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}. {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleStartQuiz}
            className="btn-primary-green w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" /> Start AI Quiz Session Now
          </button>
        </div>
      )}

    </div>
  );
};
