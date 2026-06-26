import type { PetKind } from './types';

export interface PetConfig {
  emoji: string;
  color: string;
  shellColor: string;
  toy: string;
  food: string;
  idleFrames: string[];
  walkFrames: string[];
  sleepFrames: string[];
  playFrames: string[];
  eatFrames: string[];
  bathFrames: string[];
  dryFrames: string[];
}

export const PET_CONFIGS: Record<PetKind, PetConfig> = {
  dog: {
    emoji: '🐕',
    color: '#c8860a',
    shellColor: '#f4a261',
    toy: '🎾',
    food: '🍖',
    idleFrames:  ['🐕', '🐕'],
    walkFrames:  ['🐕', '🐩'],
    sleepFrames: ['🛌', '😴'],
    playFrames:  ['🐕', '🎾'],
    eatFrames:   ['🐕', '🍖'],
    bathFrames:  ['🛁', '🚿'],
    dryFrames:   ['💨', '🐕'],
  },
  cat: {
    emoji: '🐈',
    color: '#6a5acd',
    shellColor: '#9d8cd6',
    toy: '🐭',
    food: '🐟',
    idleFrames:  ['🐈', '😺'],
    walkFrames:  ['🐈', '🐈‍⬛'],
    sleepFrames: ['😴', '🐈'],
    playFrames:  ['😸', '🐭'],
    eatFrames:   ['😸', '🐟'],
    bathFrames:  ['🛁', '🐈'],
    dryFrames:   ['💨', '😸'],
  },
  rabbit: {
    emoji: '🐇',
    color: '#e07b7b',
    shellColor: '#f4a1a1',
    toy: '🥕',
    food: '🥬',
    idleFrames:  ['🐇', '🐰'],
    walkFrames:  ['🐇', '🐰'],
    sleepFrames: ['😴', '🐇'],
    playFrames:  ['🐇', '🥕'],
    eatFrames:   ['🐰', '🥬'],
    bathFrames:  ['🛁', '🐇'],
    dryFrames:   ['💨', '🐇'],
  },
  hamster: {
    emoji: '🐹',
    color: '#f4a261',
    shellColor: '#ffd8a8',
    toy: '⚙️',
    food: '🌰',
    idleFrames:  ['🐹', '🐿️'],
    walkFrames:  ['🐹', '🐿️'],
    sleepFrames: ['😴', '🐹'],
    playFrames:  ['🐹', '🎡'],
    eatFrames:   ['🐹', '🌰'],
    bathFrames:  ['🛁', '🐹'],
    dryFrames:   ['💨', '🐹'],
  },
};
