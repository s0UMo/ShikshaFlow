import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { SEED_QUESTIONS } from '../data/seedQuestions';
import type { Question } from '../types/schema';
import { autoTranslateEnglishToHindi } from './translationEngine';

const STORAGE_KEY = 'shiksha_custom_questions';
const DELETED_KEY = 'shiksha_deleted_questions';

export function getCustomQuestionsLocal(): Question[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading custom questions from localStorage:', e);
    return [];
  }
}

export function getDeletedQuestionIdsLocal(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getAllQuestionsLocal(): Question[] {
  const custom = getCustomQuestionsLocal();
  const deletedIds = new Set(getDeletedQuestionIdsLocal());
  const map = new Map<string, Question>();
  
  SEED_QUESTIONS.forEach(q => {
    if (!deletedIds.has(q.id)) map.set(q.id, q);
  });
  custom.forEach(q => {
    if (!deletedIds.has(q.id)) map.set(q.id, q);
  });

  return Array.from(map.values());
}

export async function addTeacherQuestion(
  newQData: Omit<Question, 'id'>
): Promise<Question> {
  const id = `custom_q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const question: Question = {
    ...newQData,
    id,
    subject: newQData.subject || 'Mathematics',
    questionTextHindi: newQData.questionTextHindi?.trim() || autoTranslateEnglishToHindi(newQData.questionText),
    explanationHindi: newQData.explanationHindi?.trim() || autoTranslateEnglishToHindi(newQData.explanation),
  };

  // 1. Save to local storage
  const existing = getCustomQuestionsLocal();
  existing.push(question);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

  // 2. Save to Firestore
  try {
    await setDoc(doc(db, 'questions', id), question);
  } catch (err) {
    console.warn('Firestore addQuestion warning (saved to localStorage fallback):', err);
  }

  return question;
}

export async function updateTeacherQuestion(
  question: Question
): Promise<Question> {
  const updatedQ: Question = {
    ...question,
    questionTextHindi: question.questionTextHindi?.trim() || autoTranslateEnglishToHindi(question.questionText),
    explanationHindi: question.explanationHindi?.trim() || autoTranslateEnglishToHindi(question.explanation),
  };

  // 1. Update local storage
  const existing = getCustomQuestionsLocal();
  const idx = existing.findIndex(q => q.id === question.id);
  if (idx >= 0) existing[idx] = updatedQ;
  else existing.push(updatedQ);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

  // 2. Update Firestore
  try {
    await setDoc(doc(db, 'questions', question.id), updatedQ);
  } catch (err) {
    console.warn('Firestore updateQuestion warning:', err);
  }

  return updatedQ;
}

export async function deleteTeacherQuestion(
  questionId: string
): Promise<void> {
  // 1. Remove from local storage custom questions
  const existing = getCustomQuestionsLocal();
  const filtered = existing.filter(q => q.id !== questionId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

  // 2. Record deleted ID
  const deleted = getDeletedQuestionIdsLocal();
  if (!deleted.includes(questionId)) {
    deleted.push(questionId);
    localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
  }

  // 3. Delete from Firestore
  try {
    await deleteDoc(doc(db, 'questions', questionId));
  } catch (err) {
    console.warn('Firestore deleteQuestion warning:', err);
  }
}

export function subscribeQuestions(onUpdate: (questions: Question[]) => void): () => void {
  // Emit initial combined local state immediately
  onUpdate(getAllQuestionsLocal());

  if (!navigator.onLine) return () => {};

  try {
    const unsub = onSnapshot(collection(db, 'questions'), (snap) => {
      if (!snap.empty) {
        const firestoreQuestions = snap.docs.map(d => d.data() as Question);
        const deletedIds = new Set(getDeletedQuestionIdsLocal());
        const map = new Map<string, Question>();

        SEED_QUESTIONS.forEach(q => {
          if (!deletedIds.has(q.id)) map.set(q.id, q);
        });
        firestoreQuestions.forEach(q => {
          if (!deletedIds.has(q.id)) map.set(q.id, q);
        });

        const combined = Array.from(map.values());
        onUpdate(combined);
      }
    }, (err) => {
      console.warn('Firestore question snapshot error:', err);
    });
    return unsub;
  } catch (err) {
    console.warn('subscribeQuestions error:', err);
    return () => {};
  }
}
