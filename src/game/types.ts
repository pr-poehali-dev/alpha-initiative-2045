export type PetKind = 'dog' | 'cat' | 'rabbit' | 'hamster';

export type PetState =
  | 'idle'
  | 'walking'
  | 'sleeping'
  | 'playing'
  | 'eating'
  | 'bathing'
  | 'drying';

export interface PetStats {
  hunger: number;   // 0–100
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
  x: number;       // % of field width
  y: number;       // % of field height
  dir: 1 | -1;     // direction
  targetX: number;
  targetY: number;
  level: number;
  xp: number;
}

export type Action = 'sleep' | 'play' | 'feed' | 'wash';
