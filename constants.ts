import { Point } from './types';

// The specific geometry for the Puli Meka board
export const NODES: Point[] = [
  { id: 0, x: 50, y: 5 },
  { id: 1, x: 15, y: 25 }, { id: 2, x: 41, y: 25 }, { id: 3, x: 50, y: 25 }, { id: 4, x: 59, y: 25 }, { id: 5, x: 85, y: 25 },
  { id: 6, x: 15, y: 45 }, { id: 7, x: 32, y: 45 }, { id: 8, x: 50, y: 45 }, { id: 9, x: 68, y: 45 }, { id: 10, x: 85, y: 45 },
  { id: 11, x: 5, y: 65 }, { id: 12, x: 23, y: 65 }, { id: 13, x: 50, y: 65 }, { id: 14, x: 77, y: 65 }, { id: 15, x: 95, y: 65 },
  { id: 16, x: 5, y: 85 }, { id: 17, x: 14, y: 85 }, { id: 18, x: 50, y: 85 }, { id: 19, x: 86, y: 85 }, { id: 20, x: 95, y: 85 },
  { id: 21, x: 10, y: 95 }, { id: 22, x: 50, y: 95 }, { id: 23, x: 90, y: 95 }
];

export const ADJACENCY: Record<number, number[]> = {
  0: [2, 3, 4],
  1: [2, 6], 2: [1, 3, 0, 7], 3: [2, 4, 0, 8], 4: [3, 5, 0, 9], 5: [4, 10],
  6: [1, 7], 7: [6, 8, 2, 12], 8: [7, 9, 3, 13], 9: [8, 10, 4, 14], 10: [5, 9],
  11: [12, 16], 12: [11, 13, 7, 17], 13: [12, 14, 8, 18], 14: [13, 15, 9, 19], 15: [14, 20],
  16: [11, 17], 17: [16, 18, 12, 21], 18: [17, 19, 13, 22], 19: [18, 20, 14, 23], 20: [15, 19],
  21: [17, 22], 22: [18, 21, 23], 23: [22, 19]
};

// [Start, Middle (Jumped), End]
export const JUMP_PATHS = [
  [0, 3, 8], [3, 8, 13], [8, 13, 18], [13, 18, 22],
  [0, 2, 7], [2, 7, 12], [7, 12, 17], [12, 17, 21],
  [0, 4, 9], [4, 9, 14], [9, 14, 19], [14, 19, 23],
  [1, 2, 3], [2, 3, 4], [3, 4, 5], [6, 7, 8], [7, 8, 9], [8, 9, 10],
  [11, 12, 13], [12, 13, 14], [13, 14, 15], [16, 17, 18], [17, 18, 19], [18, 19, 20], [21, 22, 23]
];

export const INITIAL_BOARD: Record<number, 'tiger'> = {
  0: 'tiger', 3: 'tiger', 8: 'tiger', 13: 'tiger'
};

export const AI_PROFILES = {
  easy: { name: 'Penguin', avatar: '🐧', color: 'bg-green-500', borderColor: 'border-green-500' },
  medium: { name: 'Chintu', avatar: '🐶', color: 'bg-orange-500', borderColor: 'border-orange-500' },
  hard: { name: 'Odiyamma', avatar: '🐻', color: 'bg-red-600', borderColor: 'border-red-600' }
};
