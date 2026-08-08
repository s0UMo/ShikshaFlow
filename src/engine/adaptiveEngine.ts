import type { DifficultyTier, MathTopic, Question } from '../types/schema';

export interface AdaptiveEngineInput {
  topic: MathTopic;
  currentTier: DifficultyTier;
  rollingHistory: boolean[]; // Array of recent attempt outcomes (true = correct, false = incorrect)
  availableQuestions: Question[];
  answeredQuestionIds?: string[];
}

export interface AdaptiveEngineResult {
  nextTier: DifficultyTier;
  promoted: boolean;
  demoted: boolean;
  nextQuestion: Question | null;
  reason: string;
}

/**
 * Calculates the next difficulty tier based on rolling accuracy rules:
 * - 3 correct in a row at current tier -> Promote (easy -> medium -> hard)
 * - 2 wrong in a row at current tier -> Demote (hard -> medium -> easy)
 * - Otherwise -> Stay at current tier
 */
export function calculateNextTier(
  currentTier: DifficultyTier,
  rollingHistory: boolean[]
): { nextTier: DifficultyTier; promoted: boolean; demoted: boolean; reason: string } {
  // Check for 3 consecutive correct answers at the end of history
  const last3 = rollingHistory.slice(-3);
  const is3CorrectInRow = last3.length === 3 && last3.every((res) => res === true);

  // Check for 2 consecutive wrong answers at the end of history
  const last2 = rollingHistory.slice(-2);
  const is2WrongInRow = last2.length === 2 && last2.every((res) => res === false);

  if (is3CorrectInRow) {
    if (currentTier === 'easy') {
      return {
        nextTier: 'medium',
        promoted: true,
        demoted: false,
        reason: 'Promoted to MEDIUM after 3 consecutive correct answers.',
      };
    }
    if (currentTier === 'medium') {
      return {
        nextTier: 'hard',
        promoted: true,
        demoted: false,
        reason: 'Promoted to HARD after 3 consecutive correct answers.',
      };
    }
    return {
      nextTier: 'hard',
      promoted: false,
      demoted: false,
      reason: 'Maintained HARD tier (3 consecutive correct at max difficulty).',
    };
  }

  if (is2WrongInRow) {
    if (currentTier === 'hard') {
      return {
        nextTier: 'medium',
        promoted: false,
        demoted: true,
        reason: 'Demoted to MEDIUM after 2 consecutive wrong answers.',
      };
    }
    if (currentTier === 'medium') {
      return {
        nextTier: 'easy',
        promoted: false,
        demoted: true,
        reason: 'Demoted to EASY after 2 consecutive wrong answers.',
      };
    }
    return {
      nextTier: 'easy',
      promoted: false,
      demoted: false,
      reason: 'Maintained EASY tier (2 consecutive wrong at base difficulty).',
    };
  }

  return {
    nextTier: currentTier,
    promoted: false,
    demoted: false,
    reason: `Maintained ${currentTier.toUpperCase()} tier (no promotion/demotion threshold hit).`,
  };
}

/**
 * Selects the next question matching topic and target difficulty tier, avoiding recently answered questions.
 */
export function selectNextQuestion(
  topic: MathTopic,
  targetTier: DifficultyTier,
  availableQuestions: Question[],
  answeredQuestionIds: string[] = []
): Question | null {
  // Filter questions matching topic & difficulty tier
  const matchingQuestions = availableQuestions.filter(
    (q) => q.topic === topic && q.difficulty === targetTier
  );

  if (matchingQuestions.length === 0) {
    // Fallback: any question in topic if tier pool is empty
    const topicFallback = availableQuestions.filter((q) => q.topic === topic);
    return topicFallback.length > 0 ? topicFallback[0] : null;
  }

  // Exclude already answered questions
  const unaskedQuestions = matchingQuestions.filter(
    (q) => !answeredQuestionIds.includes(q.id)
  );

  if (unaskedQuestions.length > 0) {
    // Pick random unasked question
    const randomIndex = Math.floor(Math.random() * unaskedQuestions.length);
    return unaskedQuestions[randomIndex];
  }

  // If all questions in tier were asked, loop back and pick random from tier pool
  const randomIndex = Math.floor(Math.random() * matchingQuestions.length);
  return matchingQuestions[randomIndex];
}

/**
 * Main adaptive engine pipeline function
 */
export function evaluateAdaptiveStep(input: AdaptiveEngineInput): AdaptiveEngineResult {
  const { currentTier, rollingHistory, topic, availableQuestions, answeredQuestionIds = [] } = input;
  
  const tierDecision = calculateNextTier(currentTier, rollingHistory);
  const nextQuestion = selectNextQuestion(
    topic,
    tierDecision.nextTier,
    availableQuestions,
    answeredQuestionIds
  );

  return {
    ...tierDecision,
    nextQuestion,
  };
}
