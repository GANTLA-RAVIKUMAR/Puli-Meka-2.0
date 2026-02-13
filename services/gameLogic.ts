import { ADJACENCY, JUMP_PATHS, NODES } from '../constants';
import { Player, Difficulty, GameState, GOATS_TOTAL, GOATS_TO_WIN } from '../types';

export const getValidMoves = (
  id: number,
  turn: Player,
  board: Record<number, Player>,
  goatsPlaced: number
): number[] => {
  // If placing goats, no board moves for goats yet
  // However, for UI purposes, we want to know where we can place.
  // The UI usually calls this with 'id' of an existing piece.
  if (turn === 'goat' && goatsPlaced < GOATS_TOTAL) return [];

  // Standard moves to empty adjacent nodes
  const moves = (ADJACENCY[id] || []).filter(n => !board[n]);

  // Tiger capture jumps
  if (turn === 'tiger') {
    JUMP_PATHS.forEach(path => {
      const [start, middle, end] = path;
      if (start === id && board[middle] === 'goat' && !board[end]) {
        moves.push(end);
      }
      if (end === id && board[middle] === 'goat' && !board[start]) {
        moves.push(start);
      }
    });
  }

  return moves;
};

export const checkWinCondition = (
  board: Record<number, Player>,
  goatsCaptured: number,
  turn: Player
): { gameOver: boolean; winner: Player | null; reason: string } => {
  if (goatsCaptured >= GOATS_TO_WIN) {
    return { gameOver: true, winner: 'tiger', reason: `Tigers captured ${GOATS_TO_WIN} goats!` };
  }

  // Check if tigers are trapped
  const tigers = Object.entries(board).filter(([_, type]) => type === 'tiger');
  const canTigerMove = tigers.some(([idStr]) => {
    const id = parseInt(idStr);
    const moves = getValidMoves(id, 'tiger', board, GOATS_TOTAL); 
    return moves.length > 0;
  });

  if (!canTigerMove) {
    return { gameOver: true, winner: 'goat', reason: 'Tigers are trapped!' };
  }

  return { gameOver: false, winner: null, reason: '' };
};

// AI LOGIC
interface AIMove {
  from?: number; // undefined if placing a goat
  to: number;
}

export const calculateAIMove = (
  gameState: GameState,
  difficulty: Difficulty,
  aiRole: Player
): AIMove | null => {
  const { board, goatsPlaced } = gameState;

  if (aiRole === 'tiger') {
    return calculateTigerMove(board, difficulty);
  } else {
    return calculateGoatMove(board, goatsPlaced, difficulty);
  }
};

const calculateTigerMove = (board: Record<number, Player>, difficulty: Difficulty): AIMove | null => {
  const tigers = Object.keys(board)
    .map(Number)
    .filter(id => board[id] === 'tiger');
  
  // Collect all possible moves for all tigers
  const possibleMoves: { from: number; to: number; isJump: boolean }[] = [];

  tigers.forEach(id => {
    // Normal moves
    (ADJACENCY[id] || []).forEach(neighbor => {
      if (!board[neighbor]) {
        possibleMoves.push({ from: id, to: neighbor, isJump: false });
      }
    });

    // Jumps
    JUMP_PATHS.forEach(path => {
      const [start, middle, end] = path;
      if (start === id && board[middle] === 'goat' && !board[end]) {
        possibleMoves.push({ from: id, to: end, isJump: true });
      }
      if (end === id && board[middle] === 'goat' && !board[start]) {
        possibleMoves.push({ from: id, to: start, isJump: true });
      }
    });
  });

  if (possibleMoves.length === 0) return null;

  // --- AI STRATEGIES ---

  // EASY: Pure Random
  if (difficulty === 'easy') {
    return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
  }

  // MEDIUM: Greedy (Always Jump if possible, otherwise random)
  const jumpMoves = possibleMoves.filter(m => m.isJump);
  if (difficulty === 'medium') {
    if (jumpMoves.length > 0) {
        return jumpMoves[Math.floor(Math.random() * jumpMoves.length)];
    }
    return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
  }

  // HARD: Scored Heuristic (Lookahead 1 ply to avoid traps)
  if (difficulty === 'hard') {
     // Score each move
     const scoredMoves = possibleMoves.map(move => {
        let score = 0;
        
        // 1. Prioritize Jumps significantly
        if (move.isJump) score += 100;

        // 2. Safety Check: Does this move leave this specific Tiger trapped next turn?
        // Create hypothetical board state
        const nextBoard = { ...board };
        delete nextBoard[move.from];
        nextBoard[move.to] = 'tiger';

        // Check valid moves from the NEW position
        const nextMoves = getValidMoves(move.to, 'tiger', nextBoard, GOATS_TOTAL);
        if (nextMoves.length === 0) {
            score -= 50; // Severe penalty for getting trapped
        } else {
            score += nextMoves.length * 5; // Bonus for mobility
        }

        return { move, score };
     });

     // Sort by score (descending)
     scoredMoves.sort((a, b) => b.score - a.score);
     
     // Filter for the best score
     const bestScore = scoredMoves[0].score;
     const bestMoves = scoredMoves.filter(m => m.score === bestScore);
     
     // Pick random from best moves to vary gameplay
     return bestMoves[Math.floor(Math.random() * bestMoves.length)].move;
  }

  return possibleMoves[0];
};

const calculateGoatMove = (
  board: Record<number, Player>,
  goatsPlaced: number,
  difficulty: Difficulty
): AIMove | null => {
  // PLACEMENT PHASE
  if (goatsPlaced < GOATS_TOTAL) {
    const emptyNodes = NODES.map(n => n.id).filter(id => !board[id]);
    
    // Hard/Medium: Try to place near tigers to crowd them (risky but aggressive)
    if (difficulty !== 'easy') {
      const tigers = Object.keys(board).map(Number).filter(id => board[id] === 'tiger');
      const nearTigers = emptyNodes.filter(id => 
        tigers.some(tId => ADJACENCY[tId]?.includes(id))
      );
      
      // 50% chance to play aggressive, otherwise random
      if (nearTigers.length > 0 && Math.random() > 0.5) {
        return { to: nearTigers[Math.floor(Math.random() * nearTigers.length)] };
      }
    }
    
    return { to: emptyNodes[Math.floor(Math.random() * emptyNodes.length)] };
  }

  // MOVEMENT PHASE
  const goats = Object.keys(board).map(Number).filter(id => board[id] === 'goat');
  const possibleMoves: AIMove[] = [];

  goats.forEach(id => {
    (ADJACENCY[id] || []).forEach(neighbor => {
      if (!board[neighbor]) {
        possibleMoves.push({ from: id, to: neighbor });
      }
    });
  });

  if (possibleMoves.length === 0) return null;
  
  // Heuristic for movement can be added here, but staying random for now is usually sufficient for Goat AI at this level
  return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
};