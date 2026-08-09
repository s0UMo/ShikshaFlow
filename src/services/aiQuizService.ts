import type { Question, MathTopic, DifficultyTier } from '../types/schema';

export interface AIQuizParams {
  prompt?: string;
  topic: MathTopic;
  difficulty: DifficultyTier;
  count: number;
}

/**
 * Generates AI custom math questions based on user prompt, topic, and difficulty.
 * Uses Groq API or Gemini API, falling back to an intelligent procedural generator.
 */
export async function generateAIQuiz(params: AIQuizParams): Promise<Question[]> {
  const env = (import.meta as any).env || {};
  const groqKey = env.VITE_GROQ_API_KEY || (globalThis as any).process?.env?.VITE_GROQ_API_KEY;
  const geminiKey = env.VITE_GEMINI_API_KEY || (globalThis as any).process?.env?.VITE_GEMINI_API_KEY;

  // 1. Try Groq API (Ultra-fast LLM generation)
  if (groqKey && groqKey.startsWith('gsk_')) {
    try {
      const questions = await fetchGroqAIQuiz(params, groqKey);
      if (questions && questions.length > 0) {
        console.log('✅ Generated AI Quiz using Groq API (Llama 3.3 70B)');
        return questions;
      }
    } catch (err) {
      console.warn('Groq API call failed, attempting Gemini API fallback:', err);
    }
  }

  // 2. Try Gemini API
  if (geminiKey) {
    try {
      const questions = await fetchGeminiAIQuiz(params, geminiKey);
      if (questions && questions.length > 0) {
        console.log('✅ Generated AI Quiz using Gemini API');
        return questions;
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to procedural generator:', err);
    }
  }

  // 3. Fallback to intelligent procedural AI Math generator
  console.log('⚡ Using intelligent procedural generator for offline/fast mode');
  return generateProceduralAIQuiz(params);
}

async function fetchGroqAIQuiz(params: AIQuizParams, apiKey: string): Promise<Question[]> {
  const promptText = `You are a Math teacher creating a quiz for students.
Generate ${params.count} unique, high-quality multiple choice math questions about topic "${params.topic}" at difficulty level "${params.difficulty}".
Context/Theme: ${params.prompt || 'General Math practice'}.

CRITICAL LANGUAGE REQUIREMENTS:
- "questionText": MUST be strictly in English.
- "options": Array of 4 options strictly in English (e.g. ["1/4", "2/4", "1/2", "1/8"]).
- "explanation": Step-by-step solution strictly in English.
- "questionTextHindi": The question translated into clear Hindi.
- "optionsHindi": Array of 4 options translated into clear Hindi.
- "explanationHindi": Step-by-step solution translated into clear Hindi.

Return a JSON object with a "questions" key containing an array of ${params.count} question objects with this exact structure:
{
  "questions": [
    {
      "id": "ai_groq_${Date.now()}",
      "subject": "Mathematics",
      "topic": "${params.topic}",
      "difficulty": "${params.difficulty}",
      "questionText": "Question in English",
      "questionTextHindi": "Question translated into Hindi",
      "options": ["Option A (English)", "Option B (English)", "Option C (English)", "Option D (English)"],
      "optionsHindi": ["Option A (Hindi)", "Option B (Hindi)", "Option C (Hindi)", "Option D (Hindi)"],
      "correctAnswerIndex": 0,
      "explanation": "Step-by-step solution in English",
      "explanationHindi": "Step-by-step solution in Hindi"
    }
  ]
}`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: promptText }],
      response_format: { type: 'json_object' },
      temperature: 0.5
    })
  });

  if (!res.ok) throw new Error(`Groq API error ${res.status}: ${res.statusText}`);
  const data = await res.json();
  const contentStr = data.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(contentStr);
  const questionsList = parsed.questions || parsed.data || parsed;
  return Array.isArray(questionsList) ? questionsList : [];
}

async function fetchGeminiAIQuiz(params: AIQuizParams, apiKey: string): Promise<Question[]> {
  const promptText = `You are a Math teacher creating a quiz for students.
Generate ${params.count} unique, high-quality multiple choice math questions about topic "${params.topic}" at difficulty level "${params.difficulty}".
Context/Theme: ${params.prompt || 'General Math practice'}.

CRITICAL REQUIREMENTS:
- "questionText", "options", "explanation" MUST be strictly in English.
- "questionTextHindi", "optionsHindi", "explanationHindi" MUST be in Hindi.

For EACH question, return a JSON object with this structure:
{
  "id": "ai_gem_${Date.now()}",
  "subject": "Mathematics",
  "topic": "${params.topic}",
  "difficulty": "${params.difficulty}",
  "questionText": "Question in English",
  "questionTextHindi": "Question in Hindi",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "optionsHindi": ["Option A in Hindi", "Option B in Hindi", "Option C in Hindi", "Option D in Hindi"],
  "correctAnswerIndex": 0,
  "explanation": "Step-by-step solution in English",
  "explanationHindi": "Step-by-step solution in Hindi"
}

Return ONLY a JSON array of ${params.count} objects.`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }]
    })
  });

  if (!res.ok) throw new Error(`Gemini API error ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Could not parse JSON array from Gemini response');
  
  const parsed = JSON.parse(jsonMatch[0]) as Question[];
  return parsed;
}

/**
 * Intelligent procedural generator that constructs realistic Math questions dynamically.
 */
function generateProceduralAIQuiz(params: AIQuizParams): Question[] {
  const questions: Question[] = [];
  const count = Math.max(1, Math.min(10, params.count));

  for (let i = 0; i < count; i++) {
    const id = `ai_proc_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;

    if (params.topic === 'fractions') {
      const num1 = Math.floor(Math.random() * 5) + 1;
      const den1 = Math.floor(Math.random() * 4) + 2;
      const num2 = Math.floor(Math.random() * 5) + 1;
      const den2 = den1; // common denominator
      const ansNum = num1 + num2;
      const wrong1 = ansNum + 1;
      const wrong2 = Math.max(1, ansNum - 1);
      const wrong3 = ansNum + 2;

      questions.push({
        id,
        subject: 'Mathematics (AI Generated)',
        topic: 'fractions',
        difficulty: params.difficulty,
        questionText: `AI Challenge #${i + 1}: What is ${num1}/${den1} + ${num2}/${den2}?`,
        questionTextHindi: `AI प्रश्न #${i + 1}: ${num1}/${den1} + ${num2}/${den2} का मान क्या होगा?`,
        options: [
          `${ansNum}/${den1}`,
          `${wrong1}/${den1 * 2}`,
          `${wrong2}/${den1}`,
          `${wrong3}/${den1}`
        ],
        correctAnswerIndex: 0,
        explanation: `With the same denominator ${den1}, add numerators: ${num1} + ${num2} = ${ansNum}. So answer is ${ansNum}/${den1}.`,
        explanationHindi: `समान हर ${den1} होने पर अंशों को जोड़ें: ${num1} + ${num2} = ${ansNum}। अतः उत्तर ${ansNum}/${den1} है।`
      });
    } else if (params.topic === 'ratios') {
      const a = (Math.floor(Math.random() * 4) + 1) * 2;
      const b = (Math.floor(Math.random() * 4) + 1) * 2;
      const simpA = a / 2;
      const simpB = b / 2;

      questions.push({
        id,
        subject: 'Mathematics (AI Generated)',
        topic: 'ratios',
        difficulty: params.difficulty,
        questionText: `AI Challenge #${i + 1}: Simplify the ratio ${a} : ${b} to its simplest form.`,
        questionTextHindi: `AI प्रश्न #${i + 1}: अनुपात ${a} : ${b} को इसके सरलतम रूप में लिखें।`,
        options: [
          `${simpA} : ${simpB}`,
          `${simpA + 1} : ${simpB}`,
          `${simpA} : ${simpB + 1}`,
          `${a * 2} : ${b * 2}`
        ],
        correctAnswerIndex: 0,
        explanation: `Divide both terms of ${a} : ${b} by their common factor 2 to get ${simpA} : ${simpB}.`,
        explanationHindi: `${a} : ${b} के दोनों पदों को उनके उभयनिष्ठ गुणनखंड 2 से विभाजित करने पर ${simpA} : ${simpB} प्राप्त होता है।`
      });
    } else if (params.topic === 'geometry') {
      const side = Math.floor(Math.random() * 8) + 3;
      const perimeter = side * 4;
      const area = side * side;

      questions.push({
        id,
        subject: 'Mathematics (AI Generated)',
        topic: 'geometry',
        difficulty: params.difficulty,
        questionText: `AI Challenge #${i + 1}: A square has a side length of ${side} cm. What is its area?`,
        questionTextHindi: `AI प्रश्न #${i + 1}: एक वर्ग की भुजा ${side} सेमी है। इसका क्षेत्रफल क्या होगा?`,
        options: [
          `${area} cm²`,
          `${perimeter} cm²`,
          `${area + side} cm²`,
          `${area - 2} cm²`
        ],
        correctAnswerIndex: 0,
        explanation: `Area of a square = side × side = ${side} × ${side} = ${area} cm².`,
        explanationHindi: `वर्ग का क्षेत्रफल = भुजा × भुजा = ${side} × ${side} = ${area} सेमी²।`
      });
    } else {
      // decimals
      const d1 = (Math.floor(Math.random() * 40) + 10) / 10;
      const d2 = (Math.floor(Math.random() * 40) + 10) / 10;
      const ans = parseFloat((d1 + d2).toFixed(1));
      const w1 = parseFloat((ans + 0.2).toFixed(1));
      const w2 = parseFloat((ans - 0.3).toFixed(1));
      const w3 = parseFloat((ans + 1.1).toFixed(1));

      questions.push({
        id,
        subject: 'Mathematics (AI Generated)',
        topic: 'decimals',
        difficulty: params.difficulty,
        questionText: `AI Challenge #${i + 1}: Calculate ${d1} + ${d2}.`,
        questionTextHindi: `AI प्रश्न #${i + 1}: ${d1} + ${d2} की गणना करें।`,
        options: [
          `${ans}`,
          `${w1}`,
          `${w2}`,
          `${w3}`
        ],
        correctAnswerIndex: 0,
        explanation: `Align decimals: ${d1} + ${d2} = ${ans}.`,
        explanationHindi: `दशमलव जोड़ें: ${d1} + ${d2} = ${ans}।`
      });
    }
  }

  return questions;
}
