import { doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { SEED_QUESTIONS } from '../data/seedQuestions';
import type { User, StudentProgress } from '../types/schema';

export const SEED_STUDENTS: User[] = [
  { id: 'student-1', name: 'Rohan Sharma', role: 'student', createdAt: new Date().toISOString() },
  { id: 'student-2', name: 'Ananya Verma', role: 'student', createdAt: new Date().toISOString() },
  { id: 'student-3', name: 'Aarav Patel', role: 'student', createdAt: new Date().toISOString() },
  { id: 'student-4', name: 'Priya Singh', role: 'student', createdAt: new Date().toISOString() },
  { id: 'student-5', name: 'Vikram Das', role: 'student', createdAt: new Date().toISOString() },
];

export const INITIAL_PROGRESS: StudentProgress[] = [
  // Rohan (Medium/High progress)
  { id: 'student-1_fractions', studentId: 'student-1', topic: 'fractions', currentTier: 'medium', rollingHistory: [true, true, true], rollingAccuracy: 100, totalAttempts: 6, correctCount: 5, streakCount: 3, badges: ['streak_3'], lastUpdated: Date.now() },
  { id: 'student-1_ratios', studentId: 'student-1', topic: 'ratios', currentTier: 'easy', rollingHistory: [true, false, true], rollingAccuracy: 66, totalAttempts: 3, correctCount: 2, streakCount: 1, badges: [], lastUpdated: Date.now() },
  { id: 'student-1_geometry', studentId: 'student-1', topic: 'geometry', currentTier: 'hard', rollingHistory: [true, true, true], rollingAccuracy: 100, totalAttempts: 8, correctCount: 8, streakCount: 5, badges: ['streak_5', 'geometry_master'], lastUpdated: Date.now() },
  { id: 'student-1_decimals', studentId: 'student-1', topic: 'decimals', currentTier: 'medium', rollingHistory: [true, true, false], rollingAccuracy: 66, totalAttempts: 4, correctCount: 3, streakCount: 0, badges: [], lastUpdated: Date.now() },

  // Ananya (Stuck student example - low accuracy in fractions)
  { id: 'student-2_fractions', studentId: 'student-2', topic: 'fractions', currentTier: 'easy', rollingHistory: [false, false, false], rollingAccuracy: 0, totalAttempts: 5, correctCount: 1, streakCount: 0, badges: [], lastUpdated: Date.now() },
  { id: 'student-2_ratios', studentId: 'student-2', topic: 'ratios', currentTier: 'easy', rollingHistory: [false, true, false], rollingAccuracy: 33, totalAttempts: 3, correctCount: 1, streakCount: 0, badges: [], lastUpdated: Date.now() },
  { id: 'student-2_geometry', studentId: 'student-2', topic: 'geometry', currentTier: 'medium', rollingHistory: [true, true, false], rollingAccuracy: 66, totalAttempts: 4, correctCount: 3, streakCount: 0, badges: [], lastUpdated: Date.now() },
  { id: 'student-2_decimals', studentId: 'student-2', topic: 'decimals', currentTier: 'easy', rollingHistory: [false, false, true], rollingAccuracy: 33, totalAttempts: 4, correctCount: 1, streakCount: 1, badges: [], lastUpdated: Date.now() },

  // Aarav (High performer - hard tier mastered)
  { id: 'student-3_fractions', studentId: 'student-3', topic: 'fractions', currentTier: 'hard', rollingHistory: [true, true, true], rollingAccuracy: 100, totalAttempts: 7, correctCount: 7, streakCount: 7, badges: ['streak_5', 'fraction_master'], lastUpdated: Date.now() },
  { id: 'student-3_ratios', studentId: 'student-3', topic: 'ratios', currentTier: 'hard', rollingHistory: [true, true, true], rollingAccuracy: 100, totalAttempts: 6, correctCount: 6, streakCount: 6, badges: ['ratio_master'], lastUpdated: Date.now() },
  { id: 'student-3_geometry', studentId: 'student-3', topic: 'geometry', currentTier: 'medium', rollingHistory: [true, true, true], rollingAccuracy: 100, totalAttempts: 4, correctCount: 4, streakCount: 4, badges: [], lastUpdated: Date.now() },
  { id: 'student-3_decimals', studentId: 'student-3', topic: 'decimals', currentTier: 'hard', rollingHistory: [true, true, true], rollingAccuracy: 100, totalAttempts: 5, correctCount: 5, streakCount: 5, badges: ['decimal_master'], lastUpdated: Date.now() },
];

// Seed to LocalStorage Fallback (instant offline demo support)
export const seedLocalStorage = () => {
  localStorage.setItem('shiksha_questions', JSON.stringify(SEED_QUESTIONS));
  localStorage.setItem('shiksha_students', JSON.stringify(SEED_STUDENTS));
  localStorage.setItem('shiksha_progress', JSON.stringify(INITIAL_PROGRESS));
  console.log('Local Seed Completed: 30 Questions & 5 Students Loaded.');
};

// Seed to Firestore (when online / initialized)
export const seedFirestoreData = async () => {
  try {
    const batch = writeBatch(db);

    // 1. Questions
    SEED_QUESTIONS.forEach((q) => {
      const ref = doc(db, 'questions', q.id);
      batch.set(ref, q);
    });

    // 2. Students
    SEED_STUDENTS.forEach((student) => {
      const ref = doc(db, 'users', student.id);
      batch.set(ref, student);
    });

    // 3. Student Progress
    INITIAL_PROGRESS.forEach((prog) => {
      const ref = doc(db, 'studentProgress', prog.id);
      batch.set(ref, prog);
    });

    await batch.commit();
    console.log('Firestore Database Seeded Successfully!');
    return true;
  } catch (error) {
    console.warn('Firestore seeding offline or using fallback cache:', error);
    // Always populate local storage fallback
    seedLocalStorage();
    return false;
  }
};
