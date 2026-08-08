import type { MathTopic, DifficultyTier } from '../types/schema';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const BADGE_DEFINITIONS: Record<string, Badge> = {
  streak_3: {
    id: 'streak_3',
    name: '3-in-a-Row',
    description: 'Answered 3 consecutive questions correctly',
    icon: '🔥',
    color: 'from-amber-500 to-orange-600',
  },
  streak_5: {
    id: 'streak_5',
    name: 'Super Streak',
    description: 'Answered 5 consecutive questions correctly',
    icon: '⚡',
    color: 'from-purple-500 to-pink-600',
  },
  fractions_master: {
    id: 'fractions_master',
    name: 'Fractions Master',
    description: 'Reached Hard tier in Fractions',
    icon: '🥇',
    color: 'from-emerald-500 to-teal-600',
  },
  ratios_master: {
    id: 'ratios_master',
    name: 'Ratio Scholar',
    description: 'Reached Hard tier in Ratios',
    icon: '🎯',
    color: 'from-blue-500 to-indigo-600',
  },
  geometry_master: {
    id: 'geometry_master',
    name: 'Geometry Wizard',
    description: 'Reached Hard tier in Geometry',
    icon: '📐',
    color: 'from-violet-500 to-purple-600',
  },
  decimals_master: {
    id: 'decimals_master',
    name: 'Decimal Ace',
    description: 'Reached Hard tier in Decimals',
    icon: '🔢',
    color: 'from-cyan-500 to-blue-600',
  },
};

/**
 * Checks and awards new badges based on current streak count, tier, and topic.
 */
export function checkBadgesToAward(
  currentBadges: string[],
  streakCount: number,
  topic: MathTopic,
  newTier: DifficultyTier
): { updatedBadges: string[]; newlyAwarded: Badge[] } {
  const badgeSet = new Set(currentBadges);
  const newlyAwarded: Badge[] = [];

  // Check 3 streak
  if (streakCount >= 3 && !badgeSet.has('streak_3')) {
    badgeSet.add('streak_3');
    newlyAwarded.push(BADGE_DEFINITIONS.streak_3);
  }

  // Check 5 streak
  if (streakCount >= 5 && !badgeSet.has('streak_5')) {
    badgeSet.add('streak_5');
    newlyAwarded.push(BADGE_DEFINITIONS.streak_5);
  }

  // Check topic mastery
  if (newTier === 'hard') {
    const topicBadgeId = `${topic}_master`;
    if (BADGE_DEFINITIONS[topicBadgeId] && !badgeSet.has(topicBadgeId)) {
      badgeSet.add(topicBadgeId);
      newlyAwarded.push(BADGE_DEFINITIONS[topicBadgeId]);
    }
  }

  return {
    updatedBadges: Array.from(badgeSet),
    newlyAwarded,
  };
}
