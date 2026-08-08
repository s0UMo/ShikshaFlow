import { evaluateAdaptiveStep } from './adaptiveEngine';
import { SEED_QUESTIONS } from '../data/seedQuestions';
import type { DifficultyTier, MathTopic } from '../types/schema';

export function runSimulation() {
  const topic: MathTopic = 'fractions';
  let currentTier: DifficultyTier = 'easy';
  let rollingHistory: boolean[] = [];
  const answeredQuestionIds: string[] = [];

  // Simulated answers for 20 questions (simulating a learning curve)
  // Student starts answering correctly, gets promoted to Medium, then Hard, makes a few mistakes, gets demoted, and recovers.
  const simulatedAnswers = [
    true, true, true,   // Q1-Q3: 3 correct at Easy -> Should promote to Medium
    true, true, true,   // Q4-Q6: 3 correct at Medium -> Should promote to Hard
    false, false,       // Q7-Q8: 2 wrong at Hard -> Should demote to Medium
    false, false,       // Q9-Q10: 2 wrong at Medium -> Should demote to Easy
    true, true, true,   // Q11-Q13: 3 correct at Easy -> Should promote to Medium
    true, false, true,  // Q14-Q16: Mixed at Medium -> Should stay Medium
    true, true, true    // Q17-Q19: 3 correct at Medium -> Should promote to Hard
  ];

  console.log('===============================================================');
  console.log('     SHIKSHAFLOW ADAPTIVE DIFFICULTY ENGINE SIMULATION        ');
  console.log('===============================================================');
  console.log(`Topic: ${topic.toUpperCase()} | Initial Tier: EASY\n`);

  simulatedAnswers.forEach((isCorrect, index) => {
    const stepNumber = index + 1;
    
    // Evaluate step
    const result = evaluateAdaptiveStep({
      topic,
      currentTier,
      rollingHistory,
      availableQuestions: SEED_QUESTIONS,
      answeredQuestionIds,
    });

    const previousTier = currentTier;
    const answeredQuestion = result.nextQuestion;
    if (answeredQuestion) {
      answeredQuestionIds.push(answeredQuestion.id);
    }

    // Append answer to rolling history
    rollingHistory.push(isCorrect);

    // Update current tier for next iteration
    currentTier = result.nextTier;

    const statusBadge = isCorrect ? '✅ CORRECT  ' : '❌ INCORRECT';
    const tierChangeStr = previousTier !== currentTier 
      ? ` ➡️ [TIER CHANGE: ${previousTier.toUpperCase()} -> ${currentTier.toUpperCase()}]` 
      : ` [Tier: ${currentTier.toUpperCase()}]`;

    console.log(
      `Step ${stepNumber < 10 ? '0' + stepNumber : stepNumber}: ${statusBadge} | ${result.reason}${tierChangeStr}`
    );
    if (answeredQuestion) {
      console.log(`   └─ Question [${answeredQuestion.id}] (${answeredQuestion.difficulty.toUpperCase()}): "${answeredQuestion.questionText.slice(0, 50)}..."`);
    }
    console.log('---------------------------------------------------------------');
  });

  console.log('\nFINAL SIMULATION SUMMARY:');
  console.log(`Total Questions Answered: ${simulatedAnswers.length}`);
  console.log(`Final Difficulty Tier: ${currentTier.toUpperCase()}`);
  console.log(`Total Unique Questions Served: ${new Set(answeredQuestionIds).size}`);
  console.log('===============================================================\n');
}

// Run if executed directly
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('simulateAdaptiveEngine')) {
  runSimulation();
}
