import React, { useState, useEffect, useCallback } from 'react';
import { Menu as MenuIcon, RotateCcw, Flag, ArrowLeftRight, Maximize, Minimize } from 'lucide-react';
import Board from './components/Board';
import Menu from './components/Menu';
import Modal from './components/Modal';
import { GameState, GameConfig, Player, Difficulty, GOATS_TOTAL, GOATS_TO_WIN } from './types';
import { getValidMoves, checkWinCondition, calculateAIMove } from './services/gameLogic';
import { AI_PROFILES, INITIAL_BOARD } from './constants';

const App: React.FC = () => {
  // State
  const [config, setConfig] = useState<GameConfig>({
    mode: 'pvp',
    aiRole: 'tiger', // Default AI is Tiger
    difficulty: 'easy',
    visualMode: 'emoji'
  });

  const [gameState, setGameState] = useState<GameState>({
    board: { ...INITIAL_BOARD },
    turn: 'goat',
    goatsPlaced: 0,
    goatsCaptured: 0,
    selectedNode: null,
    validMoves: [],
    gameOver: false,
    winner: null,
    history: []
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [lastMove, setLastMove] = useState<{from: number, to: number} | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Reset Game
  const resetGame = useCallback(() => {
    setGameState({
      board: { ...INITIAL_BOARD },
      turn: 'goat',
      goatsPlaced: 0,
      goatsCaptured: 0,
      selectedNode: null,
      validMoves: [],
      gameOver: false,
      winner: null,
      history: []
    });
    setLastMove(null);
  }, []);

  // Effect to handle mode/config changes
  useEffect(() => {
    resetGame();
  }, [config.mode, config.aiRole, config.difficulty, resetGame]);

  // Handle Full Screen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
            console.warn("Fullscreen API failed", err);
            // Still toggle state for "Zen Mode" styling even if API fails (e.g. iOS)
            setIsFullScreen(true);
        });
    } else {
        document.exitFullscreen().catch((err) => console.warn(err));
        setIsFullScreen(false);
    }
  };

  // Sync state with browser fullscreen changes (e.g. Escape key)
  useEffect(() => {
      const handleFsChange = () => {
          setIsFullScreen(!!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', handleFsChange);
      return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Handle Move Logic
  const executeMove = (from: number | null, to: number) => {
    if (gameState.gameOver) return;

    const newBoard = { ...gameState.board };
    let captured = gameState.goatsCaptured;
    let placed = gameState.goatsPlaced;
    
    // Check capture (Jump)
    if (from !== null) {
      delete newBoard[from];
      
      if (gameState.turn === 'tiger') {
         // Determine captured piece using Jump Paths
         const jumpPath = [
            [0, 3, 8], [3, 8, 13], [8, 13, 18], [13, 18, 22],
            [0, 2, 7], [2, 7, 12], [7, 12, 17], [12, 17, 21],
            [0, 4, 9], [4, 9, 14], [9, 14, 19], [14, 19, 23],
            [1, 2, 3], [2, 3, 4], [3, 4, 5], [6, 7, 8], [7, 8, 9], [8, 9, 10],
            [11, 12, 13], [12, 13, 14], [13, 14, 15], [16, 17, 18], [17, 18, 19], [18, 19, 20], [21, 22, 23]
         ].find(p => (p[0] === from && p[2] === to) || (p[2] === from && p[0] === to));

         if (jumpPath) {
           const capturedId = jumpPath[1];
           if (newBoard[capturedId] === 'goat') {
             delete newBoard[capturedId];
             captured++;
           }
         }
      }
    } else {
      placed++;
    }

    newBoard[to] = gameState.turn;
    const nextTurn = gameState.turn === 'tiger' ? 'goat' : 'tiger';
    const winState = checkWinCondition(newBoard, captured, nextTurn);

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      turn: nextTurn,
      goatsPlaced: placed,
      goatsCaptured: captured,
      selectedNode: null,
      validMoves: [],
      gameOver: winState.gameOver,
      winner: winState.winner
    }));
    setLastMove(from !== null ? { from, to } : { from: to, to });
  };

  // Handle User Click
  const handleNodeClick = (id: number) => {
    if (gameState.gameOver) return;
    
    // Prevent Human from clicking during AI Turn
    if (config.mode === 'pve' && gameState.turn === config.aiRole) return;

    const piece = gameState.board[id];
    
    // Select own piece
    if (piece === gameState.turn) {
      if (gameState.turn === 'goat' && gameState.goatsPlaced < GOATS_TOTAL) return;
      
      const moves = getValidMoves(id, gameState.turn, gameState.board, gameState.goatsPlaced);
      setGameState(prev => ({ ...prev, selectedNode: id, validMoves: moves }));
      return;
    }

    // Place Goat (Empty node)
    if (!piece && gameState.turn === 'goat' && gameState.goatsPlaced < GOATS_TOTAL) {
      executeMove(null, id);
      return;
    }

    // Move to valid empty node
    if (gameState.selectedNode !== null && gameState.validMoves.includes(id)) {
      executeMove(gameState.selectedNode, id);
      return;
    }

    setGameState(prev => ({ ...prev, selectedNode: null, validMoves: [] }));
  };

  // AI Logic Trigger
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    // Check if it's AI's turn
    if (
      !gameState.gameOver &&
      config.mode === 'pve' &&
      gameState.turn === config.aiRole
    ) {
      // Delay to simulate thinking
      timer = setTimeout(() => {
        const move = calculateAIMove(gameState, config.difficulty, config.aiRole);
        if (move) {
          executeMove(move.from ?? null, move.to);
        }
      }, 800);
    }
    
    return () => clearTimeout(timer);
  }, [gameState.turn, gameState.gameOver, config.mode, config.aiRole, config.difficulty]);

  // Role Swap Handler
  const handleSwapRole = () => {
    const newRole = config.aiRole === 'tiger' ? 'goat' : 'tiger';
    setConfig(prev => ({ ...prev, aiRole: newRole }));
  };

  const currentAI = AI_PROFILES[config.difficulty];
  const goatsRemaining = GOATS_TOTAL - gameState.goatsPlaced;

  return (
    <div className={`flex flex-col items-center transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-50 bg-slate-100 overflow-hidden' : 'min-h-screen bg-slate-50'}`}>
      {/* Header */}
      {!isFullScreen && (
        <header className="w-full max-w-md px-6 pt-6 pb-2 flex justify-between items-center">
            <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Puli Meka</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Strategy Game</p>
            </div>
            <div className="flex gap-2">
                <button 
                onClick={toggleFullScreen}
                className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
                title="Full Screen"
                >
                <Maximize className="w-5 h-5" />
                </button>
                <button 
                onClick={() => setIsMenuOpen(true)}
                className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
                >
                <MenuIcon className="w-6 h-6" />
                </button>
            </div>
        </header>
      )}

      {/* Floating Exit Fullscreen Button */}
      {isFullScreen && (
        <button 
            onClick={toggleFullScreen}
            className="absolute top-4 right-4 z-[60] w-12 h-12 bg-white/50 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-slate-800 hover:bg-white/80 transition-all"
            title="Exit Full Screen"
        >
            <Minimize className="w-6 h-6" />
        </button>
      )}

      {/* Main Content Layout */}
      {/* Uses CSS Grid for FullScreen to handle Landscape/Portrait layouts efficiently */}
      <main className={`
          ${isFullScreen 
             ? 'w-full h-full p-6 grid grid-cols-1 grid-rows-[auto_1fr_auto] landscape:grid-cols-[20rem_1fr] landscape:grid-rows-[auto_1fr] gap-6' 
             : 'flex-1 w-full max-w-md px-4 flex flex-col pb-6'
           }
      `}>
        
        {/* SECTION 1: Game Status */}
        <div className={`
             bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between
             ${isFullScreen ? 'landscape:col-start-1 landscape:row-start-1 h-fit' : 'mt-4 mb-6'}
        `}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${gameState.turn === 'tiger' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
              {gameState.turn === 'tiger' ? '🐅' : '🐐'}
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase">Current Turn</p>
              <p className="font-black text-slate-800 text-lg leading-none mt-1">
                {gameState.turn === 'tiger' ? 'Tiger' : 'Goat'}
              </p>
            </div>
          </div>
          
          {goatsRemaining > 0 && (
            <div className="flex flex-col items-center px-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-tight text-center">To Place</p>
                <p className="font-black text-slate-700 text-xl leading-none mt-1">{goatsRemaining}</p>
            </div>
          )}
          
          <div className="text-right">
             <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-slate-400 uppercase">Captured</span>
                <span className="text-xl font-black text-red-500">{gameState.goatsCaptured} <span className="text-sm text-slate-300">/ {GOATS_TO_WIN}</span></span>
             </div>
          </div>
        </div>

        {/* SECTION 2: Board */}
        <div className={`
            relative
            ${isFullScreen 
               ? 'landscape:col-start-2 landscape:row-span-2 landscape:row-start-1 flex items-center justify-center h-full' 
               : 'mb-6'
             }
        `}>
          <Board 
            gameState={gameState} 
            visualMode={config.visualMode} 
            onNodeClick={handleNodeClick}
            lastMove={lastMove}
            isFullScreen={isFullScreen}
          />
        </div>

        {/* SECTION 3: Controls & Info */}
        <div className={`
             space-y-4 
             ${isFullScreen 
                ? 'landscape:col-start-1 landscape:row-start-2 landscape:self-end' 
                : 'mb-8'
             }
        `}>
            {config.mode === 'pve' ? (
                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl border-2 border-slate-100 rounded-full p-1">{currentAI.avatar}</span>
                            <div>
                                <p className="font-bold text-slate-800 text-sm leading-tight">{currentAI.name} <span className="text-slate-400 font-normal">(AI)</span></p>
                                <p className={`text-[10px] font-bold uppercase tracking-wider ${currentAI.color.replace('bg-', 'text-')}`}>
                                    {config.difficulty}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Playing As</p>
                            <p className="text-sm font-bold text-slate-700 capitalize">{config.aiRole}</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleSwapRole}
                        className="w-full flex items-center justify-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 py-3 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100"
                    >
                        <ArrowLeftRight className="w-3 h-3" />
                        Swap Roles
                    </button>
                 </div>
            ) : (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center gap-3">
                    <span className="text-2xl">👥</span>
                    <div>
                        <p className="font-bold text-slate-800">Local Multiplayer</p>
                        <p className="text-xs text-slate-500 font-medium">Pass device to play</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => setGameState(prev => ({ ...prev, gameOver: true, winner: prev.turn === 'goat' ? 'tiger' : 'goat' }))}
                    disabled={gameState.gameOver}
                    className="flex items-center justify-center gap-2 bg-red-50 text-red-600 py-4 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                    <Flag className="w-4 h-4" /> Surrender
                </button>
                <button 
                    onClick={resetGame}
                    className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-4 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                    <RotateCcw className="w-4 h-4" /> Reset
                </button>
            </div>
        </div>
      </main>

      {/* Menu Drawer */}
      <Menu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        config={config} 
        setConfig={setConfig}
        onReset={resetGame}
        onShowRules={() => setIsRulesOpen(true)}
      />

      {/* Rules Modal */}
      <Modal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} title="How to Play">
         <div className="space-y-6">
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <h3 className="flex items-center gap-2 font-black text-orange-800 mb-2">
                    <span className="text-xl">🐅</span> Tigers (Team of 4)
                </h3>
                <ul className="text-sm text-orange-900 space-y-1 ml-6 list-disc">
                    <li>Start at fixed positions on the board.</li>
                    <li><strong>Goal:</strong> Capture {GOATS_TO_WIN} Goats.</li>
                    <li>Move to any adjacent empty spot.</li>
                    <li><strong>Jump</strong> over a Goat to an empty spot immediately behind it to capture it.</li>
                </ul>
            </div>

            <div className="p-4 bg-slate-100 rounded-xl border border-slate-200">
                <h3 className="flex items-center gap-2 font-black text-slate-700 mb-2">
                    <span className="text-xl">🐐</span> Meka / Goats (Team of 18)
                </h3>
                <ul className="text-sm text-slate-800 space-y-1 ml-6 list-disc">
                    <li>Start off-board. Place one per turn.</li>
                    <li><strong>Goal:</strong> Trap all Tigers so they cannot move.</li>
                    <li>Cannot move until all 18 pieces are placed.</li>
                    <li>Once all placed, move to adjacent empty spots.</li>
                    <li>Goats cannot capture Tigers.</li>
                </ul>
            </div>
            
            <button 
                onClick={() => setIsRulesOpen(false)}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
            >
                Start Playing
            </button>
         </div>
      </Modal>

      {/* Game Over Modal */}
      <Modal isOpen={gameState.gameOver} onClose={resetGame} title={gameState.winner === 'tiger' ? 'Tigers Win!' : 'Meka Wins!'}>
        <div className="text-center">
            <div className="text-8xl mb-6 animate-bounce">
                {gameState.winner === 'tiger' ? '🐅' : '🐐'}
            </div>
            <p className="text-slate-600 mb-8 text-lg font-medium">
                {gameState.winner === 'tiger' 
                    ? "The tigers have successfully captured enough prey." 
                    : "The goats have successfully defended their herd by trapping the tigers!"}
            </p>
            <div className="flex gap-4">
                <button 
                    onClick={resetGame} 
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors"
                >
                    Play Again
                </button>
                 <button 
                    onClick={() => setConfig({...config, mode: config.mode === 'pvp' ? 'pve' : 'pvp'})} 
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                    Switch Mode
                </button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;