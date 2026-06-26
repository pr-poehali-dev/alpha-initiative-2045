import type { PetData, PetState, Action, PetStats } from './types';

const clamp = (v: number) => Math.max(0, Math.min(100, v));

export const STAT_DECAY: Record<keyof PetStats, number> = {
  hunger: 1.8,
  happiness: 1.2,
  energy: 0.8,
  hygiene: 1.0,
};

const ACTION_EFFECTS: Record<Action, Partial<PetStats>> = {
  sleep: { energy: 40, hunger: -8 },
  play:  { happiness: 30, energy: -15, hunger: -10 },
  feed:  { hunger: 35, happiness: 8, energy: 5 },
  wash:  { hygiene: 40, happiness: 6 },
};

const ACTION_STATE: Record<Action, PetState> = {
  sleep: 'sleeping',
  play:  'playing',
  feed:  'eating',
  wash:  'bathing',
};

const ACTION_DURATION: Record<Action, number> = {
  sleep: 8000,
  play:  5000,
  feed:  4000,
  wash:  6000,
};

export function applyAction(pet: PetData, action: Action): PetData {
  const effects = ACTION_EFFECTS[action];
  return {
    ...pet,
    state: ACTION_STATE[action],
    stats: {
      hunger:    clamp(pet.stats.hunger    + (effects.hunger    ?? 0)),
      happiness: clamp(pet.stats.happiness + (effects.happiness ?? 0)),
      energy:    clamp(pet.stats.energy    + (effects.energy    ?? 0)),
      hygiene:   clamp(pet.stats.hygiene   + (effects.hygiene   ?? 0)),
    },
    xp: pet.xp + 10,
  };
}

export function getActionDuration(action: Action): number {
  return ACTION_DURATION[action];
}

export function decayStats(pet: PetData, delta: number): PetData {
  if (pet.state !== 'idle' && pet.state !== 'walking') return pet;
  const secs = delta / 1000;
  return {
    ...pet,
    stats: {
      hunger:    clamp(pet.stats.hunger    - STAT_DECAY.hunger    * secs),
      happiness: clamp(pet.stats.happiness - STAT_DECAY.happiness * secs),
      energy:    clamp(pet.stats.energy    - STAT_DECAY.energy    * secs),
      hygiene:   clamp(pet.stats.hygiene   - STAT_DECAY.hygiene   * secs),
    },
  };
}

export function getMoodEmoji(avg: number): string {
  if (avg > 75) return '😄';
  if (avg > 50) return '🙂';
  if (avg > 25) return '😟';
  return '😰';
}

export function getXpToLevel(level: number): number {
  return level * 50;
}
