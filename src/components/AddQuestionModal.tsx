import React, { useState, useEffect } from 'react';
import { X, PlusCircle, HelpCircle, CheckCircle2, Sparkles, Edit3, PieChart, Scale, Shapes, Hash } from 'lucide-react';
import type { MathTopic, DifficultyTier, Question } from '../types/schema';
import { addTeacherQuestion, updateTeacherQuestion } from '../services/questionService';
import { autoTranslateEnglishToHindi } from '../services/translationEngine';
import { translateTextWithAI } from '../services/aiTranslationService';

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionAdded?: (q: Question) => void;
  initialQuestion?: Question | null;
}

const TOPICS: { value: MathTopic; label: string; icon: any }[] = [
  { value: 'fractions', label: 'Fractions', icon: PieChart },
  { value: 'ratios',    label: 'Ratios',    icon: Scale },
  { value: 'geometry',  label: 'Geometry',  icon: Shapes },
  { value: 'decimals',  label: 'Decimals',  icon: Hash },
];

const TIERS: { value: DifficultyTier; label: string; color: string }[] = [
  { value: 'easy',   label: 'Easy Tier',   color: 'border-sky-500/40 text-sky-300 bg-sky-500/10' },
  { value: 'medium', label: 'Medium Tier', color: 'border-amber-500/40 text-amber-300 bg-amber-500/10' },
  { value: 'hard',   label: 'Hard Tier',   color: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10' },
];

export const AddQuestionModal: React.FC<AddQuestionModalProps> = ({ 
  isOpen, onClose, onQuestionAdded, initialQuestion 
}) => {
  const [topic, setTopic]                       = useState<MathTopic>('fractions');
  const [difficulty, setDifficulty]             = useState<DifficultyTier>('medium');
  const [questionText, setQuestionText]         = useState('');
  const [questionTextHindi, setQuestionTextHindi] = useState('');
  const [options, setOptions]                   = useState<string[]>(['', '', '', '']);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number>(0);
  const [explanation, setExplanation]           = useState('');
  const [explanationHindi, setExplanationHindi] = useState('');
  const [loading, setLoading]                   = useState(false);
  const [isTranslating, setIsTranslating]       = useState(false);
  const [targetLang, setTargetLang]             = useState<string>('Hindi');
  const [error, setError]                       = useState<string | null>(null);
  const [success, setSuccess]                   = useState(false);

  useEffect(() => {
    if (initialQuestion) {
      setTopic(initialQuestion.topic);
      setDifficulty(initialQuestion.difficulty);
      setQuestionText(initialQuestion.questionText);
      setQuestionTextHindi(initialQuestion.questionTextHindi || '');
      setOptions([...initialQuestion.options]);
      setCorrectAnswerIndex(initialQuestion.correctAnswerIndex);
      setExplanation(initialQuestion.explanation);
      setExplanationHindi(initialQuestion.explanationHindi || '');
    } else {
      setTopic('fractions');
      setDifficulty('medium');
      setQuestionText('');
      setQuestionTextHindi('');
      setOptions(['', '', '', '']);
      setCorrectAnswerIndex(0);
      setExplanation('');
      setExplanationHindi('');
    }
  }, [initialQuestion, isOpen]);

  if (!isOpen) return null;

  const handleAutoTranslate = async () => {
    if (!questionText.trim() && !explanation.trim()) return;
    setIsTranslating(true);
    try {
      if (questionText.trim()) {
        const qTrans = await translateTextWithAI(questionText, targetLang);
        setQuestionTextHindi(qTrans);
      }
      if (explanation.trim()) {
        const expTrans = await translateTextWithAI(explanation, targetLang);
        setExplanationHindi(expTrans);
      }
    } catch (e) {
      console.error('AI translation error:', e);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleQuestionTextChange = (val: string) => {
    setQuestionText(val);
    if (!questionTextHindi || questionTextHindi === autoTranslateEnglishToHindi(questionText)) {
      setQuestionTextHindi(autoTranslateEnglishToHindi(val));
    }
  };

  const handleExplanationChange = (val: string) => {
    setExplanation(val);
    if (!explanationHindi || explanationHindi === autoTranslateEnglishToHindi(explanation)) {
      setExplanationHindi(autoTranslateEnglishToHindi(val));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!questionText.trim()) return setError('Please enter the question text.');
    if (options.some(opt => !opt.trim())) return setError('Please fill in all 4 option choices.');
    if (!explanation.trim()) return setError('Please enter an explanation for the answer.');

    setLoading(true);

    try {
      let saved: Question;
      if (initialQuestion) {
        saved = await updateTeacherQuestion({
          ...initialQuestion,
          subject: initialQuestion.subject || 'Mathematics',
          topic,
          difficulty,
          questionText: questionText.trim(),
          questionTextHindi: questionTextHindi.trim() || autoTranslateEnglishToHindi(questionText.trim()),
          options: options.map(o => o.trim()),
          correctAnswerIndex,
          explanation: explanation.trim(),
          explanationHindi: explanationHindi.trim() || autoTranslateEnglishToHindi(explanation.trim()),
        });
      } else {
        saved = await addTeacherQuestion({
          subject: 'Mathematics',
          topic,
          difficulty,
          questionText: questionText.trim(),
          questionTextHindi: questionTextHindi.trim() || autoTranslateEnglishToHindi(questionText.trim()),
          options: options.map(o => o.trim()),
          correctAnswerIndex,
          explanation: explanation.trim(),
          explanationHindi: explanationHindi.trim() || autoTranslateEnglishToHindi(explanation.trim()),
        });
      }

      setSuccess(true);
      if (onQuestionAdded) onQuestionAdded(saved);

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);

    } catch (err: any) {
      console.error('Failed to save question:', err);
      setError(err?.message || 'Failed to save question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card-feature-light w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/25 text-[#3ecf8e]">
              {initialQuestion ? <Edit3 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialQuestion ? 'Edit Question' : 'Add Custom Question'}
              </h2>
              <p className="text-xs text-[#52525b]">
                {initialQuestion ? 'Update question text, choices, and explanations' : 'Create a new math question for student adaptive practice'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#52525b] hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Question added successfully! It is now live in student quizzes.</span>
            </div>
          )}

          {/* Topic & Tier Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Topic */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#9ca3af] font-medium">Topic</label>
              <div className="grid grid-cols-2 gap-1.5">
                {TOPICS.map(t => {
                  const TopicIcon = t.icon;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTopic(t.value)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center gap-2 transition-all ${
                        topic === t.value
                          ? 'bg-[#3ecf8e]/15 text-[#3ecf8e] border-[#3ecf8e]/40'
                          : 'bg-[#1c1c1c] text-[#9ca3af] border-white/[0.06] hover:text-white'
                      }`}
                    >
                      <TopicIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty Tier */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#9ca3af] font-medium">Difficulty Tier</label>
              <div className="grid grid-cols-3 gap-1.5">
                {TIERS.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setDifficulty(t.value)}
                    className={`py-2 px-2 rounded-lg text-[11px] font-semibold border text-center transition-all ${
                      difficulty === t.value
                        ? t.color
                        : 'bg-[#1c1c1c] text-[#9ca3af] border-white/[0.06] hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Question Text (English) */}
          <div className="space-y-1.5">
            <label className="text-xs text-[#9ca3af] font-medium flex items-center justify-between">
              <span>Question Text (English) *</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. What is 3/4 + 1/2 in simplest form?"
              value={questionText}
              onChange={e => handleQuestionTextChange(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-white/[0.08] rounded-xl p-3 text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-[#3ecf8e]/60 transition-colors resize-none"
            />
          </div>

          {/* Question Text (Multi-Language Auto-Generated by AI) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#9ca3af] font-medium flex items-center gap-2">
                <span>Translation:</span>
                <select
                  value={targetLang}
                  onChange={e => setTargetLang(e.target.value)}
                  className="bg-[#1c1c1c] text-[#3ecf8e] text-[11px] font-semibold border border-[#3ecf8e]/30 rounded px-2 py-0.5 focus:outline-none cursor-pointer"
                >
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Bengali">Bengali (বাংলা)</option>
                  <option value="Malayalam">Malayalam (മലയാളം)</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Telugu">Telugu (తెలుగు)</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                  <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                  <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                  <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                  <option value="Odia">Odia (ଓଡ଼ିଆ)</option>
                  <option value="Assamese">Assamese (অসমীয়া)</option>
                  <option value="Urdu">Urdu (اردو)</option>
                </select>
              </label>

              {questionText.trim() && (
                <button
                  type="button"
                  disabled={isTranslating}
                  onClick={handleAutoTranslate}
                  className="text-[11px] text-[#3ecf8e] hover:underline flex items-center gap-1 font-semibold disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className={`w-3 h-3 text-[#3ecf8e] ${isTranslating ? 'animate-spin' : ''}`} />
                  <span>{isTranslating ? `Translating into ${targetLang}...` : `Translate to ${targetLang} with AI`}</span>
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder={`AI generated ${targetLang} translation will appear here...`}
              value={questionTextHindi}
              onChange={e => setQuestionTextHindi(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#3ecf8e]/60 transition-colors"
            />
          </div>

          {/* Options (4 choices) */}
          <div className="space-y-2">
            <label className="text-xs text-[#9ca3af] font-medium flex items-center justify-between">
              <span>Multiple Choice Options *</span>
              <span className="text-[11px] text-[#52525b]">Select the correct radio button</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  onClick={() => setCorrectAnswerIndex(idx)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                    correctAnswerIndex === idx
                      ? 'bg-[#3ecf8e]/10 border-[#3ecf8e]/40'
                      : 'bg-[#1c1c1c] border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={correctAnswerIndex === idx}
                    onChange={() => setCorrectAnswerIndex(idx)}
                    className="accent-[#3ecf8e] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-[#52525b] shrink-0">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <input
                    type="text"
                    required
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    value={opt}
                    onChange={e => handleOptionChange(idx, e.target.value)}
                    className="w-full bg-transparent text-xs text-white placeholder-[#52525b] focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-1.5">
            <label className="text-xs text-[#9ca3af] font-medium">Explanation *</label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Find common denominator 4: 3/4 + 2/4 = 5/4 = 1 1/4."
              value={explanation}
              onChange={e => handleExplanationChange(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-white/[0.08] rounded-xl p-3 text-xs text-white placeholder-[#52525b] focus:outline-none focus:border-[#3ecf8e]/60 transition-colors resize-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-[#9ca3af] hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="btn-primary-green text-xs px-5 py-2.5 font-semibold flex items-center gap-2 disabled:opacity-60"
            >
              {initialQuestion ? <Edit3 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              {loading ? 'Saving...' : initialQuestion ? 'Save Changes' : 'Add Question'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
