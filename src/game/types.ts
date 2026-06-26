export type PetKind = 'dog' | 'cat' | 'rabbit' | 'hamster';

export type PetState =
  | 'idle'
  | 'walking'
  | 'sleeping'
  | 'playing'
  | 'eating'
  | 'bathing'
  | 'drying'
  | 'dying'
  | 'dead'
  | 'frozen';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface PetStats {
  hunger: number;     // 0–100
  happiness: number;
  energy: number;
  hygiene: number;
}

export interface PetData {
  id: string;
  kind: PetKind;
  name: string;
  state: PetState;
  stats: PetStats;
  x: number;
  y: number;
  dir: 1 | -1;
  targetX: number;
  targetY: number;
  level: number;
  xp: number;
  coins: number;
  health: number;    // 0–100
  cold: number;      // 0–100 (только зимой)
}

export type Action = 'sleep' | 'play' | 'feed' | 'wash';
