import type { PetData, PetState, Action, PetStats, Season } from './types';

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
  const isWarm = action === 'wash' || action === 'sleep';
  const coldReduction = isWarm ? 40 : 0;
  const coinBonus = action === 'feed' ? 5 : 2;
  return {
    ...pet,
    state: ACTION_STATE[action],
    stats: {
      hunger:    clamp(pet.stats.hunger    + (effects.hunger    ?? 0)),
      happiness: clamp(pet.stats.happiness + (effects.happiness ?? 0)),
      energy:    clamp(pet.stats.energy    + (effects.energy    ?? 0)),
      hygiene:   clamp(pet.stats.hygiene   + (effects.hygiene   ?? 0)),
    },
    cold: clamp(pet.cold - coldReduction),
    xp: pet.xp + 10,
    coins: pet.coins + coinBonus,
  };
}

export function getActionDuration(action: Action): number {
  return ACTION_DURATION[action];
}

export function decayStats(pet: PetData, delta: number, season: Season): PetData {
  if (pet.state === 'dead' || pet.state === 'frozen') return pet;
  if (pet.state !== 'idle' && pet.state !== 'walking') return pet;

  const secs = delta / 1000;
  const newStats: PetStats = {
    hunger:    clamp(pet.stats.hunger    - STAT_DECAY.hunger    * secs),
    happiness: clamp(pet.stats.happiness - STAT_DECAY.happiness * secs),
    energy:    clamp(pet.stats.energy    - STAT_DECAY.energy    * secs),
    hygiene:   clamp(pet.stats.hygiene   - STAT_DECAY.hygiene   * secs),
  };

  const avg = (newStats.hunger + newStats.happiness + newStats.energy + newStats.hygiene) / 4;
  const healthDelta = avg < 10 ? -8 * secs : avg < 25 ? -2 * secs : 0.5 * secs;
  const newHealth = clamp(pet.health + healthDelta);

  const coldDecay = season === 'winter' ? 6 * secs : 0;
  const newCold = clamp(pet.cold + coldDecay);

  let newState = pet.state;
  if (newHealth <= 0) newState = 'dead';
  else if (newCold >= 100) newState = 'frozen';
  else if (newHealth < 20 && pet.state !== 'dying') newState = 'dying';

  return {
    ...pet,
    stats: newStats,
    health: newHealth,
    cold: newCold,
    state: newState,
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
