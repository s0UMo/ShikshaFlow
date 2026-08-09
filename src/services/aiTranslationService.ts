import { autoTranslateEnglishToHindi, translateQuestionContent } from './translationEngine';
import { SUPPORTED_LANGUAGES } from './i18nService';

const CACHE_KEY = 'shiksha_ai_translation_cache';

/**
 * Retrieves cached translation from localStorage (0ms API response).
 */
function getTranslationFromCache(text: string, targetLang: string): string | null {
  try {
    const key = `${targetLang.toLowerCase().trim()}:${text.trim()}`;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    return cache[key] || null;
  } catch {
    return null;
  }
}

/**
 * Saves generated translation to persistent localStorage cache.
 */
function saveTranslationToCache(text: string, targetLang: string, translation: string): void {
  if (!text || !translation) return;
  try {
    const key = `${targetLang.toLowerCase().trim()}:${text.trim()}`;
    const raw = localStorage.getItem(CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    cache[key] = translation.trim();
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to save to translation cache:', e);
  }
}

/**
 * Translates English text to Hindi/Regional language using AI (Groq / Gemini).
 * Checks persistent cache first to ensure zero duplicate API calls.
 */
export async function translateTextWithAI(
  text: string,
  targetLang: string = 'Hindi'
): Promise<string> {
  if (!text || !text.trim()) return '';

  // 0. Instant Cache Lookup (0ms response, 0 duplicate API calls)
  const cached = getTranslationFromCache(text, targetLang);
  if (cached) {
    console.log(`⚡ Translation Cache Hit [${targetLang}]: "${text.substring(0, 30)}..."`);
    return cached;
  }

  const env = (import.meta as any).env || {};
  const groqKey = env.VITE_GROQ_API_KEY || (globalThis as any).process?.env?.VITE_GROQ_API_KEY;
  const geminiKey = env.VITE_GEMINI_API_KEY || (globalThis as any).process?.env?.VITE_GEMINI_API_KEY;

  let result = '';

  // 1. Try Groq AI Translation (Fastest LLM)
  if (groqKey && groqKey.startsWith('gsk_')) {
    try {
      const translated = await translateWithGroq(text, targetLang, groqKey);
      if (translated && translated.trim()) {
        result = translated.trim();
      }
    } catch (err) {
      console.warn('Groq AI Translation failed, attempting Gemini API:', err);
    }
  }

  // 2. Try Gemini API Translation
  if (!result && geminiKey) {
    try {
      const translated = await translateWithGemini(text, targetLang, geminiKey);
      if (translated && translated.trim()) {
        result = translated.trim();
      }
    } catch (err) {
      console.warn('Gemini AI Translation failed, falling back to translation engine:', err);
    }
  }

  // 3. Fallback to local rule engine
  if (!result) {
    const isHindi = targetLang.toLowerCase().includes('hindi');
    if (isHindi) {
      result = autoTranslateEnglishToHindi(text);
    } else {
      // Find matching language code from supported languages
      const codeMatch = SUPPORTED_LANGUAGES.find(l => l.name.toLowerCase() === targetLang.toLowerCase())?.code;
      if (codeMatch && codeMatch !== 'en') {
        const localRes = translateQuestionContent({
          id: '', subject: 'Math', topic: 'fractions', difficulty: 'easy',
          questionText: text, questionTextHindi: '', options: [], explanation: '', explanationHindi: ''
        }, codeMatch);
        result = localRes.text;
      } else {
        result = text;
      }
    }
  }

  // Store in cache for all future requests
  if (result) {
    saveTranslationToCache(text, targetLang, result);
  }

  return result;
}

async function translateWithGroq(text: string, targetLang: string, apiKey: string): Promise<string> {
  const prompt = `You are a professional educational translator for school students in India.
Translate the following math question/explanation into natural, clear, accurate ${targetLang} (using native script or clean Hinglish script).

Input English Text: "${text}"

Return ONLY a JSON object with this exact format:
{
  "translation": "Translated text here"
}`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })
  });

  if (!res.ok) throw new Error(`Groq translation error ${res.status}`);
  const data = await res.json();
  const contentStr = data.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(contentStr);
  return parsed.translation || parsed.translatedText || parsed.text || '';
}

async function translateWithGemini(text: string, targetLang: string, apiKey: string): Promise<string> {
  const prompt = `Translate the following school math text into clear ${targetLang}: "${text}". Return ONLY the translation, no extra commentary.`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!res.ok) throw new Error(`Gemini translation error ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
