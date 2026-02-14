import { ADJACENCY, JUMP_PATHS, NODES } from '../constants';
import { Player, Difficulty, GameState, GOATS_TOTAL, GOATS_TO_WIN } from '../types';

// --- TYPES ---
interface AIMove {
  from?: number;
  to: number;
}

// --- CORE GAME RULES (re-exported) ---

export const getValidMoves = (
  id: number,
  turn: Player,
  board: Record<number, Player>,
  goatsPlaced: number
): number[] => {
  // Placement Phase Check (for movement only)
  if (turn === 'goat' && goatsPlaced < GOATS_TOTAL) return [];

  // 1. Standard moves to adjacent empty nodes
  const moves = (ADJACENCY[id] || []).filter(n => !board[n]);

  // 2. Tiger capture jumps
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
  
  // Optimization: If fewer than 4 tigers on board (impossible in standard game but safe check), handle gracefully
  if (tigers.length === 0) return { gameOver: false, winner: null, reason: '' };

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

// --- AI ORCHESTRATOR ---

export const calculateAIMove = (
  gameState: GameState,
  difficulty: Difficulty,
  aiRole: Player
): AIMove | null => {
  const { board, goatsPlaced, goatsCaptured, history } = gameState;

  // 1. EASY: Random
  if (difficulty === 'easy') {
    return getRandomMove(board, aiRole, goatsPlaced);
  }

  // 2. MEDIUM: Greedy
  if (difficulty === 'medium') {
    return getGreedyMove(board, aiRole, goatsPlaced);
  }

  // 3. HARD: "Odiyamma Bunty" (Minimax + Alpha-Beta + Advanced Heuristics)
  
  // Placement Logic for Goat AI
  if (aiRole === 'goat' && goatsPlaced < GOATS_TOTAL) {
    // We use a Heuristic search with shallow lookahead for placement
    return getBestPlacementGoat(board);
  } 
  
  // Minimax Depth Strategy
  // Placement phase (Tiger moves, Goat places) has high branching factor. Use Depth 4.
  // Movement phase (Both move) has lower branching factor (Goats blocked). Use Depth 5 or 6.
  const isPlacementPhase = goatsPlaced < GOATS_TOTAL;
  const searchDepth = isPlacementPhase ? 4 : 5; 

  // Get Last Move from history to prevent immediate repetition
  const lastBoardMove = history.length > 0 ? history[history.length - 1] : null; 
  // Note: history stores board states, not moves. 
  // We will handle anti-repetition inside Minimax via score penalties for cycling.

  return getMinimaxMove(board, aiRole, goatsPlaced, goatsCaptured, searchDepth);
};

// --- AI IMPLEMENTATIONS ---

const getAllPossibleMoves = (board: Record<number, Player>, role: Player, goatsPlaced: number): AIMove[] => {
  const moves: AIMove[] = [];

  if (role === 'goat' && goatsPlaced < GOATS_TOTAL) {
    // Placement moves
    NODES.forEach(node => {
      if (!board[node.id]) {
        moves.push({ to: node.id });
      }
    });
  } else {
    // Board moves
    const pieces = Object.keys(board).map(Number).filter(id => board[id] === role);
    pieces.forEach(from => {
      const validDestinations = getValidMoves(from, role, board, goatsPlaced);
      validDestinations.forEach(to => {
        moves.push({ from, to });
      });
    });
  }
  return moves;
};

// 1. Random AI
const getRandomMove = (board: Record<number, Player>, role: Player, goatsPlaced: number): AIMove | null => {
  const moves = getAllPossibleMoves(board, role, goatsPlaced);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
};

// 2. Greedy AI
const getGreedyMove = (board: Record<number, Player>, role: Player, goatsPlaced: number): AIMove | null => {
  const moves = getAllPossibleMoves(board, role, goatsPlaced);
  if (moves.length === 0) return null;

  if (role === 'tiger') {
    // Prioritize Jumps
    const jumps = moves.filter(m => isJump(board, m));
    if (jumps.length > 0) return jumps[Math.floor(Math.random() * jumps.length)];
  }

  return moves[Math.floor(Math.random() * moves.length)];
};

// 3. Minimax AI (The "Bunty" Algorithm)

const getMinimaxMove = (
  board: Record<number, Player>,
  role: Player,
  goatsPlaced: number,
  goatsCaptured: number,
  depth: number
): AIMove | null => {
  let bestScore = -Infinity;
  let bestMoves: AIMove[] = [];
  const alpha = -Infinity;
  const beta = Infinity;

  const possibleMoves = getAllPossibleMoves(board, role, goatsPlaced);
  
  // Sort moves to maximize Alpha-Beta Pruning
  sortMovesForPruning(possibleMoves, board, role);

  for (const move of possibleMoves) {
    const { nextBoard, nextCaptured } = simulateMove(board, move, role, goatsCaptured);
    
    // Check for immediate win
    if (role === 'tiger' && nextCaptured >= GOATS_TO_WIN) return move;

    const score = minimax(
      nextBoard, 
      depth - 1, 
      alpha, 
      beta, 
      false, // Minimizing player (opponent) next
      role, // AI Role (Constant)
      goatsPlaced + (role === 'goat' && move.from === undefined ? 1 : 0),
      nextCaptured,
      move // Pass current move as 'previousMove' to next step
    );

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  // If multiple moves have same best score, pick random to vary play
  return bestMoves.length > 0 ? bestMoves[Math.floor(Math.random() * bestMoves.length)] : null;
};

const minimax = (
  board: Record<number, Player>,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiRole: Player,
  goatsPlaced: number,
  goatsCaptured: number,
  previousMove: AIMove | null
): number => {
  const opponent = aiRole === 'tiger' ? 'goat' : 'tiger';
  const currentTurn = isMaximizing ? aiRole : opponent;
  const winState = checkWinCondition(board, goatsCaptured, currentTurn);
  
  // Terminal State: Win/Loss
  if (winState.gameOver) {
    if (winState.winner === aiRole) return 20000 + depth; // Prefer winning sooner
    if (winState.winner !== aiRole) return -20000 - depth; // Prefer losing later
  }

  // Terminal State: Max Depth Reached
  if (depth === 0) {
    return evaluatePosition(board, aiRole, goatsCaptured, goatsPlaced);
  }

  const moves = getAllPossibleMoves(board, currentTurn, goatsPlaced);
  sortMovesForPruning(moves, board, currentTurn);

  if (moves.length === 0) {
     // No moves available but game not over? (Should be covered by checkWinCondition, but safe fallback)
     return currentTurn === aiRole ? -20000 : 20000;
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      // Repetition Check: Don't immediately undo the previous move
      if (previousMove && isReverseMove(move, previousMove)) {
         // Allow only if it's the only move or leads to a win, otherwise skip or penalize heavily
         if (moves.length > 1) continue; 
      }

      const { nextBoard, nextCaptured } = simulateMove(board, move, currentTurn, goatsCaptured);
      const evalScore = minimax(
        nextBoard, 
        depth - 1, 
        alpha, 
        beta, 
        false, 
        aiRole, 
        goatsPlaced + (currentTurn === 'goat' && move.from === undefined ? 1 : 0),
        nextCaptured,
        move
      );
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break; 
    }
    return maxEval === -Infinity ? -10000 : maxEval; // Handle case where all moves were pruned by repetition check
  } else {
    let minEval = Infinity;
    for (const move of moves) {
       // Repetition Check for Opponent (Assume they also avoid repetition)
      if (previousMove && isReverseMove(move, previousMove)) {
         if (moves.length > 1) continue;
      }

      const { nextBoard, nextCaptured } = simulateMove(board, move, currentTurn, goatsCaptured);
      const evalScore = minimax(
        nextBoard, 
        depth - 1, 
        alpha, 
        beta, 
        true, 
        aiRole, 
        goatsPlaced + (currentTurn === 'goat' && move.from === undefined ? 1 : 0),
        nextCaptured,
        move
      );
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval === Infinity ? 10000 : minEval;
  }
};

// --- HELPERS ---

const isReverseMove = (curr: AIMove, prev: AIMove): boolean => {
    if (curr.from === undefined || prev.from === undefined) return false;
    return curr.from === prev.to && curr.to === prev.from;
}

const simulateMove = (board: Record<number, Player>, move: AIMove, role: Player, currentCaptured: number) => {
  const nextBoard = { ...board };
  let nextCaptured = currentCaptured;

  if (move.from !== undefined) delete nextBoard[move.from];
  nextBoard[move.to] = role;

  if (role === 'tiger' && move.from !== undefined) {
     const jumpPath = JUMP_PATHS.find(p => (p[0] === move.from && p[2] === move.to) || (p[2] === move.from && p[0] === move.to));
     if (jumpPath) {
        const capturedId = jumpPath[1];
        if (nextBoard[capturedId] === 'goat') {
            delete nextBoard[capturedId];
            nextCaptured++;
        }
     }
  }
  return { nextBoard, nextCaptured };
};

const isJump = (board: Record<number, Player>, move: AIMove): boolean => {
  if (move.from === undefined) return false;
  return !!JUMP_PATHS.find(p => (p[0] === move.from && p[2] === move.to) || (p[2] === move.from && p[0] === move.to));
};

const sortMovesForPruning = (moves: AIMove[], board: Record<number, Player>, role: Player) => {
  moves.sort((a, b) => {
    // 1. Captures first (Tigers)
    if (role === 'tiger') {
      const isJumpA = isJump(board, a);
      const isJumpB = isJump(board, b);
      if (isJumpA && !isJumpB) return -1;
      if (!isJumpA && isJumpB) return 1;
    }
    // 2. Central positions (Both)
    const centerScore = (id: number) => [12, 13, 14, 8].includes(id) ? 2 : [2,3,4,18].includes(id) ? 1 : 0;
    return centerScore(b.to) - centerScore(a.to);
  });
};

// --- EVALUATION FUNCTION (ODIYAMMA SPECIAL) ---

const evaluatePosition = (
  board: Record<number, Player>,
  aiRole: Player,
  goatsCaptured: number,
  goatsPlaced: number
): number => {
  let score = 0;

  const tigers = Object.keys(board).map(Number).filter(id => board[id] === 'tiger');
  const goats = Object.keys(board).map(Number).filter(id => board[id] === 'goat');
  
  // 1. Capture Score
  // Base capture score + Bonus for getting close to 8
  score += goatsCaptured * 2000;
  if (goatsCaptured >= 7) score += 5000;

  // 2. Trapped Tigers & Mobility
  let tigerMobility = 0;
  let trappedTigers = 0;
  let captureOpportunities = 0;

  tigers.forEach(tId => {
    const moves = getValidMoves(tId, 'tiger', board, goatsPlaced);
    tigerMobility += moves.length;
    if (moves.length === 0) trappedTigers++;
    
    // Check for potential captures next turn
    moves.forEach(to => {
        // A move is a capture if it's a jump
        if (JUMP_PATHS.some(p => (p[0] === tId && p[2] === to) || (p[2] === tId && p[0] === to))) {
            captureOpportunities++;
        }
    });
  });

  if (aiRole === 'tiger') {
      score += captureOpportunities * 500; // Immediate threats
      score -= trappedTigers * 1500;       // Avoid getting stuck
      score += tigerMobility * 30;         // Keep moving
      
      // Tiger Coordination: Reward tigers being close
      let coordination = 0;
      for (let i = 0; i < tigers.length; i++) {
          for (let j = i + 1; j < tigers.length; j++) {
             // If connected directly, good.
             if ((ADJACENCY[tigers[i]] || []).includes(tigers[j])) coordination += 1;
          }
      }
      score += coordination * 60;

  } else {
      // Goat Perspective: We want to MINIMIZE the above (since score is from Tiger perspective usually, but here we adjust)
      // Actually, Minimax handles perspective. We just return a score where + is good for AI, - is bad.
      // Wait, Minimax logic above: `if (winState.winner === aiRole) return 20000`.
      // So Evaluate must return Positive for AI Advantage.
      
      // RESET SCORE to be relative to AI ROLE
      score = 0;
      
      // GOAT AI
      score -= goatsCaptured * 2500; // Losing goats is bad
      score += trappedTigers * 1500; // Trapping tigers is good
      score -= tigerMobility * 50;   // Restricting tigers is good
      score -= captureOpportunities * 1000; // Danger!
      
      // Goat Structure (Walls)
      let connections = 0;
      goats.forEach(g => {
          (ADJACENCY[g] || []).forEach(n => {
              if (board[n] === 'goat') connections++;
          });
      });
      score += connections * 40;
      
      // Central Safety (Occupy center to force tigers out)
      goats.forEach(g => { if([12,13,14,8,18].includes(g)) score += 70; });
  }

  return score;
};

// --- PLACEMENT HEURISTIC (Smart & Safe) ---
const getBestPlacementGoat = (board: Record<number, Player>): AIMove => {
  const emptyNodes = NODES.filter(n => !board[n.id]).map(n => n.id);
  const tigers = Object.keys(board).map(Number).filter(id => board[id] === 'tiger');
  
  let bestNode = -1;
  let maxScore = -Infinity;

  emptyNodes.forEach(nodeId => {
    let score = 0;

    // 1. SAFETY CHECK (Crucial)
    // Check Immediate Capture: Does placing here put it in a jump path?
    let immediateDanger = false;
    for (const path of JUMP_PATHS) {
        const [start, middle, end] = path;
        // Case: Tiger at start, Node at middle, End is empty (Goat dies immediately if placed)
        // Wait, Tiger moves AFTER placement.
        // If I place at Middle. Tiger is at Start. End is Empty.
        // Tiger can Jump Start -> End capturing Middle.
        if (middle === nodeId) {
            if ((board[start] === 'tiger' && !board[end]) || (board[end] === 'tiger' && !board[start])) {
                immediateDanger = true;
            }
        }
    }
    if (immediateDanger) {
        score -= 10000; // Do not place here
    } else {
        // 2. SECOND ORDER SAFETY (Lookahead 1 move)
        // If I place here, can a Tiger MOVE to a spot and THEN capture me?
        // This is approximated by distance to tigers.
        
        // 3. STRATEGIC VALUE
        
        // Block Tigers: Place adjacent to tigers to limit their mobility
        let adjTigers = 0;
        (ADJACENCY[nodeId] || []).forEach(n => {
            if (board[n] === 'tiger') adjTigers++;
        });
        score += adjTigers * 200; // Very good to crowd tigers (if safe)

        // Connectivity: Build walls
        let adjGoats = 0;
        (ADJACENCY[nodeId] || []).forEach(n => {
            if (board[n] === 'goat') adjGoats++;
        });
        score += adjGoats * 50;
        
        // Center Control
        if ([8, 12, 13, 14, 18].includes(nodeId)) score += 100;
        if ([2, 3, 4, 7, 9].includes(nodeId)) score += 60;
    }
    
    // Random factor to keep it interesting
    score += Math.random() * 10;

    if (score > maxScore) {
        maxScore = score;
        bestNode = nodeId;
    }
  });

  return { to: bestNode };
};