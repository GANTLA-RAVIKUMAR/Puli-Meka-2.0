export type Player = 'tiger' | 'goat';
export type GameMode = 'pvp' | 'pve';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type VisualMode = 'emoji' | 'simple';

export interface Point {
  id: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface Move {
  from: number;
  to: number;
  isJump?: boolean;
}

export interface GameState {
  board: Record<number, Player>;
  turn: Player;
  goatsPlaced: number;
  goatsCaptured: number;
  selectedNode: number | null;
  validMoves: number[];
  gameOver: boolean;
  winner: Player | null;
  history: Array<Record<number, Player>>; // Simple history for undo potential
}

export interface GameConfig {
  mode: GameMode;
  aiRole: Player;
  difficulty: Difficulty;
  visualMode: VisualMode;
}

export const GOATS_TOTAL = 18;
export const TIGERS_TOTAL = 4;
export const GOATS_TO_WIN = 8;
