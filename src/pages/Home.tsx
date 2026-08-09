import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, BrainCircuit, Globe2, Sparkles,
  BarChart3, Wifi, Zap, Users, Trophy,
  GraduationCap, CheckCircle2, Check,
  PieChart, Scale, Shapes, Hash,
  X, Minus, Maximize2
} from 'lucide-react';
import { DarkVeil } from '../components/DarkVeil';

const FEATURES = [
  {
    icon: BrainCircuit,
    title: 'Adaptive Difficulty Engine',
    desc: 'Real-time algorithm dynamically adjusts question difficulty based on student response accuracy and timing.',
  },
  {
    icon: Sparkles,
    title: 'AI Custom Quiz Generator',
    desc: 'Generates context-aware math questions instantly — from pizza fractions to cricket ratios using Groq & Llama 3.',
  },
  {
    icon: Globe2,
    title: '12 Native Indian Languages',
    desc: 'Instant cache-first translations into Hindi, Tamil, Telugu, Bengali, Marathi, and 7 more regional languages.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Teacher Analytics',
    desc: 'Instant heatmaps, stuck-student indicators, and accuracy breakdown per topic for entire classrooms.',
  },
  {
    icon: Wifi,
    title: 'Offline-First PWA Architecture',
    desc: 'IndexedDB offline queue lets students solve quizzes without internet; automatically syncs to Cloud Firestore when reconnected.',
  },
  {
    icon: Trophy,
    title: 'Gamified Achievements',
    desc: 'Motivational streak counters, level promotions, and unlockable badges for mastering core math domains.',
  },
];

const TOPICS = [
  { icon: PieChart, label: 'Fractions', desc: 'Equivalent fractions, operations & parts of a whole' },
  { icon: Scale,    label: 'Ratios',    desc: 'Comparing quantities, proportions & rates' },
  { icon: Shapes,   label: 'Geometry',  desc: 'Shapes, angles, perimeter & area formulas' },
  { icon: Hash,     label: 'Decimals',  desc: 'Place values, conversions & decimal math' },
];

const METRICS = [
  { value: '32+', label: 'Curated Math Questions' },
  { value: '3',   label: 'Adaptive Difficulty Tiers' },
  { value: '12',  label: 'Indian Regional Languages' },
  { value: '100%', label: 'Offline PWA Support' },
];

const STEPS = [
  {
    step: '01',
    title: 'Create Account',
    desc: 'Instant sign-up as Student or Teacher with local offline cache backup.',
  },
  {
    step: '02',
    title: 'Select Math Domain',
    desc: 'Pick Fractions, Ratios, Geometry, or Decimals to start an adaptive practice session.',
  },
  {
    step: '03',
    title: 'Adaptive Engine Adjusts',
    desc: 'Questions auto-scale (Easy → Medium → Hard) based on your rolling performance.',
  },
  {
    step: '04',
    title: 'Live Teacher Insights',
    desc: 'Teachers view real-time accuracy heatmaps, stuck alerts, and custom question tools.',
  },
];

const PREVIEW_TRANSLATIONS = [
  { code: 'en', name: 'English', native: 'English', text: 'Rohan ate 3/8 of a pizza for lunch and 2/8 for dinner. What fraction of the pizza did he eat in total?' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', text: 'रोहन ने दोपहर के भोजन में पिज्जा का 3/8 हिस्सा और रात के खाने में 2/8 हिस्सा खाया। उसने कुल मिलाकर पिज्जा का कितना हिस्सा खाया?' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', text: 'রোহান দুপুরের খাবারে পিজ্জার ৩/৮ অংশ এবং রাতের খাবারে ২/৮ অংশ খেয়েছে। সে মোট পিজ্জার কত অংশ খেয়েছে?' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', text: 'ரோஹன் மதிய உணவிற்கு 3/8 பிட்சாவையும், இரவு உணவிற்கு 2/8 பிட்சாவையும் சாப்பிட்டான். அவன் மொத்தமாக பிட்சாவின் என்ன பகுதியை சாப்பிட்டான்?' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', text: 'రోహన్ మధ్యాహ్న భోజనంలో 3/8 పిజ్జా, రాత్రి భోజనంలో 2/8 పిజ్జా తిన్నాడు. అతను మొత్త్ంగా పిజ్జాలో ఎంత భాగం తిన్నాడు?' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', text: 'रोहनने दुपारच्या जेवणात पिझ्झाचा 3/8 भाग आणि रात्रीच्या जेवणात 2/8 भाग खाल्ला. त्याने एकूण पिझ्झाचा किती भाग खाल्ला?' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', text: 'રોહને બપોરના ભોજનમાં પિઝાનો 3/8 ભાગ અને રાત્રિના ભોજનમાં 2/8 ભાગ ખાધો. તેણે કુલ પિઝાનો કેટલો ભાગ ખાધો?' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', text: 'രോഹൻ ഉച്ചഭക്ഷണത്തിന് പിസ്സയുടെ 3/8 ഭാഗവും അത്താഴത്തിന് 2/8 ഭാഗവും കഴിച്ചു. അവൻ ആകെ പിസ്സയുടെ എത്ര ഭാഗം കഴിച്ചു?' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', text: 'ರೋಹನ್ ಮಧ್ಯಾಹ್ನದ ಊಟಕ್ಕೆ 3/8 ಪಿಜ್ಜಾ ಮತ್ತು ರಾತ್ರಿಯ ಊಟಕ್ಕೆ 2/8 ಪಿಜ್ಜಾ ತಿಂದನು. ಅವನು ಒಟ್ಟಾರೆಯಾಗಿ ಪಿಜ್ಜಾದ ಎಷ್ಟು ಭಾಗವನ್ನು ತಿಂದನು?' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', text: 'ਰੋਹਨ ਨੇ ਦੁਪਹਿਰ ਦੇ ਖਾਣੇ ਵਿੱਚ ਪੀਜ਼ਾ ਦਾ 3/8 ਹਿੱਸਾ ਅਤੇ ਰਾਤ ਦੇ ਖਾਣੇ ਵਿੱਚ 2/8 ਹਿੱਸਾ ਖਾਧਾ। ਉਸਨੇ ਕੁੱਲ ਮਿਲਾ ਕੇ ਪੀਜ਼ਾ ਦਾ ਕਿੰਨਾ ਹਿੱਸਾ ਖਾਧਾ?' },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn]   = useState(false);
  const [userRole, setUserRole]   = useState<'student'|'teacher'>('student');
  const [previewLangIdx, setPreviewLangIdx] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setPreviewLangIdx((prev) => (prev + 1) % PREVIEW_TRANSLATIONS.length);
        setIsFading(false);
      }, 250);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('shiksha_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.id && u?.role) { setLoggedIn(true); setUserRole(u.role); }
      }
    } catch { /* ignore */ }
  }, []);

  const handleCTA = () => {
    if (loggedIn) navigate(userRole === 'teacher' ? '/teacher' : '/student');
    else navigate('/login');
  };

  return (
    <div className="w-full space-y-24 animate-fade-in pb-12">

      {/* ─── HERO (2 COLUMN) ─────────────────────────────────── */}
      <section className="w-full max-w-6xl mx-auto pt-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Headline & Actions */}
          <div className="lg:col-span-5 text-left space-y-6">
            {/* Announcement pill */}
            <div className="animate-slide-up">
              <div
                onClick={() => navigate('/student/ai-quiz')}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414] border border-white/[0.08] text-xs font-medium text-[#ededed] hover:border-white/[0.15] transition-all cursor-pointer group"
              >
                <span className="flex items-center gap-1.5 text-[#3ecf8e]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="font-semibold">AI Feature</span>
                </span>
                <span className="text-white/[0.12]">|</span>
                <span className="text-[#9ca3af] group-hover:text-[#ededed] transition-colors">
                  AI Quiz Generator
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#9ca3af] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-4 animate-slide-up delay-75">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#ededed] leading-[1.12]">
                Personalized adaptive learning for{' '}
                <span className="text-shimmer">Mathematics</span>
              </h1>
              <p className="text-sm sm:text-base text-[#9ca3af] leading-relaxed">
                ShikshaFlow automatically scales question difficulty, translates into 12 Indian languages,
                and gives teachers real-time classroom analytics.
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-slide-up delay-150">
              <button
                onClick={handleCTA}
                id="hero-cta-primary"
                className="btn-primary-green px-6 py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                {loggedIn ? (
                  <><GraduationCap className="w-4 h-4" /> Go to Dashboard</>
                ) : (
                  <><Zap className="w-4 h-4" /> Start Practising Free</>
                )}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Trust tags */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#52525b] pt-1 animate-fade-in delay-200">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#3ecf8e]" /> Offline-First PWA
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#3ecf8e]" /> 12 Native Languages
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#3ecf8e]" /> Real-time Analytics
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Live Preview Card */}
          <div className="lg:col-span-7 animate-slide-up delay-300">
            <div
              className="card-feature-light rounded-2xl shadow-2xl overflow-hidden text-left w-full"
              style={{
                border: '1px solid rgba(62,207,142,0.35)',
                boxShadow: '0 0 0 1px rgba(62,207,142,0.06), 0 0 40px 0px rgba(62,207,142,0.10), 0 8px 40px rgba(0,0,0,0.6)',
              }}
            >
              {/* Browser chrome bar */}
              <div className="bg-[#0a0a0a] border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#52525b] font-mono font-medium">shikshaflow.app/student/quiz</span>
                </div>
                {/* Traffic light window action buttons */}
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-rose-500/80 hover:bg-rose-500 transition-all flex items-center justify-center group cursor-pointer shadow-sm" title="Close">
                    <X className="w-2.5 h-2.5 text-[#0a0a0a] stroke-[3] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-all flex items-center justify-center group cursor-pointer shadow-sm" title="Minimize">
                    <Minus className="w-2.5 h-2.5 text-[#0a0a0a] stroke-[3] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-all flex items-center justify-center group cursor-pointer shadow-sm" title="Maximize">
                    <Maximize2 className="w-2 h-2 text-[#0a0a0a] stroke-[3] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>

              {/* Mockup quiz card */}
              <div className="p-5 sm:p-7 space-y-5 bg-[#0a0a0a]">
                {/* Header row */}
                <div className="flex items-center justify-between text-xs text-[#52525b] flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-[#3ecf8e] font-semibold">FRACTIONS</span>
                    <span>·</span>
                    <span>Question 3 of 5</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#3ecf8e]/10 text-[#3ecf8e] border border-[#3ecf8e]/25 text-[11px] font-semibold">
                      <Sparkles className="w-3 h-3 text-[#3ecf8e] animate-pulse" />
                      <span>{PREVIEW_TRANSLATIONS[previewLangIdx].native} ({PREVIEW_TRANSLATIONS[previewLangIdx].name})</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#1c1c1c] text-[#9ca3af] border border-white/[0.08] text-[10px] font-semibold uppercase">
                      MEDIUM TIER
                    </span>
                  </div>
                </div>

                {/* Animated Question Text */}
                <div className="min-h-[72px] flex items-center">
                  <h3 className={`text-sm sm:text-base font-medium text-[#ededed] leading-relaxed transition-all duration-300 ${
                    isFading ? 'opacity-20 translate-y-1 scale-[0.99]' : 'opacity-100 translate-y-0 scale-100'
                  }`}>
                    {PREVIEW_TRANSLATIONS[previewLangIdx].text}
                  </h3>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { letter: 'A', text: '5/16', correct: false },
                    { letter: 'B', text: '5/8',  correct: true  },
                    { letter: 'C', text: '1/8',  correct: false },
                    { letter: 'D', text: '6/8',  correct: false },
                  ].map(({ letter, text, correct }) => (
                    <div
                      key={letter}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                        correct
                          ? 'bg-[#3ecf8e]/10 border-[#3ecf8e]/60 text-[#ededed]'
                          : 'bg-[#141414] border-white/[0.06] text-[#9ca3af]'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                        correct ? 'bg-[#3ecf8e] text-[#0a0a0a]' : 'bg-[#242424] text-[#9ca3af]'
                      }`}>
                        {letter}
                      </span>
                      <span className="text-xs font-medium">{text}</span>
                      {correct && <Check className="w-3.5 h-3.5 text-[#3ecf8e] ml-auto" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── METRICS STRIP ─────────────────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-4">
        <div className="card-feature-light p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">
          {METRICS.map(({ value, label }) => (
            <div key={label} className="pt-4 sm:pt-0 first:pt-0 text-center space-y-1 px-4">
              <div className="text-3xl md:text-4xl font-bold text-[#ededed] tracking-tight">{value}</div>
              <div className="text-xs text-[#52525b]">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES GRID ──────────────────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <p className="text-xs font-semibold text-[#3ecf8e] uppercase tracking-wider">
            Features Built for Impact
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#ededed] tracking-tight">
            Everything students & teachers need
          </h2>
          <p className="text-base text-[#9ca3af]">
            Adaptive difficulty, regional language support, and offline access — built for Indian classrooms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card-feature-light p-6 flex flex-col gap-4 hover:-translate-y-0.5 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center text-[#3ecf8e] group-hover:border-[#3ecf8e]/30 transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-[#ededed]">{title}</h3>
                <p className="text-xs text-[#9ca3af] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CURRICULUM TOPICS ──────────────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div>
            <p className="text-xs font-semibold text-[#3ecf8e] uppercase tracking-wider">Mathematics</p>
            <h2 className="text-2xl font-semibold text-[#ededed] tracking-tight mt-1">Core Learning Domains</h2>
          </div>
          <button
            onClick={handleCTA}
            className="text-xs text-[#3ecf8e] hover:text-[#48dfa0] font-semibold flex items-center gap-1 transition-colors"
          >
            Start Practising <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TOPICS.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              onClick={handleCTA}
              className="card-feature-light p-5 flex flex-col gap-3 hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center text-[#3ecf8e] group-hover:border-[#3ecf8e]/30 transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#ededed] group-hover:text-[#3ecf8e] transition-colors">{label}</div>
                <div className="text-[11px] text-[#52525b] mt-0.5 leading-snug">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-2">
          <p className="text-xs font-semibold text-[#3ecf8e] uppercase tracking-wider">Simple Workflow</p>
          <h2 className="text-3xl font-semibold text-[#ededed] tracking-tight">How ShikshaFlow Works</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map(({ step, title, desc }) => (
            <div key={step} className="card-feature-light p-6 space-y-3">
              <div className="text-sm font-bold font-mono text-[#3ecf8e]">{step}</div>
              <h3 className="text-sm font-semibold text-[#ededed]">{title}</h3>
              <p className="text-xs text-[#9ca3af] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FOR TEACHERS ───────────────────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-4">
        <div className="card-feature-light p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full opacity-10 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #3ecf8e 0%, transparent 70%)' }} />

          <div className="space-y-4 max-w-xl relative z-10">
            <span className="badge-emerald flex items-center gap-1.5 w-fit">
              <Users className="w-3 h-3" /> For Teachers & Educators
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#ededed] tracking-tight">
              Real-time insights for your entire classroom
            </h2>
            <p className="text-sm text-[#9ca3af] leading-relaxed">
              Identify struggling students instantly with automated stuck-student alerts,
              view accuracy heatmaps, and create custom questions with ease.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#9ca3af]">
              {[
                'Live accuracy heatmaps',
                'Stuck-student alert system',
                'Custom question builder',
                'Offline auto-sync queue',
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#3ecf8e] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 relative z-10 w-full md:w-auto">
            <button
              onClick={handleCTA}
              className="btn-primary-green w-full md:w-auto px-6 py-3 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              {loggedIn && userRole === 'teacher' ? 'Go to Teacher Dashboard' : 'Join as Teacher'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ──────────────────────────────────────────── */}
      <section className="w-full max-w-5xl mx-auto px-4">
        <div className="card-feature-light p-10 md:p-14 text-center space-y-6 relative overflow-hidden rounded-2xl border border-white/10">
          {/* DarkVeil WebGL Animated Background */}
          <div className="absolute inset-0 pointer-events-none z-0 rounded-2xl overflow-hidden opacity-65">
            <DarkVeil
              hueShift={0}
              noiseIntensity={0}
              scanlineIntensity={0.5}
              speed={1.5}
              scanlineFrequency={32}
              warpAmount={1}
              resolutionScale={1}
            />
            {/* Subtle overlay gradient to maintain readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/70 via-transparent to-[#0a0a0a]/80 pointer-events-none" />
          </div>

          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl md:text-4xl font-semibold text-[#ededed] tracking-tight">
              Start mastering Mathematics today
            </h2>
            <p className="text-base text-[#9ca3af] max-w-md mx-auto">
              Free forever for students. Works offline on any phone, tablet, or laptop.
            </p>
            <div className="pt-2">
              <button
                onClick={handleCTA}
                id="bottom-cta-primary"
                className="btn-primary-green px-8 py-3.5 text-sm font-semibold inline-flex items-center gap-2 shadow-lg shadow-[#3ecf8e]/20"
              >
                {loggedIn ? 'Continue to Dashboard' : 'Get Started Now'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
