import React, { useMemo } from 'react';
import { NODES, ADJACENCY } from '../constants';
import { Player, VisualMode, GameState } from '../types';
import { PawPrint, Circle } from 'lucide-react';

interface BoardProps {
  gameState: GameState;
  visualMode: VisualMode;
  onNodeClick: (id: number) => void;
  lastMove: { from: number, to: number } | null;
  isFullScreen?: boolean;
}

const Board: React.FC<BoardProps> = ({ gameState, visualMode, onNodeClick, lastMove, isFullScreen = false }) => {
  const { board, selectedNode, validMoves } = gameState;

  // Calculate connections for SVG lines once
  const connections = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
    const processed = new Set<string>();

    Object.entries(ADJACENCY).forEach(([startStr, ends]) => {
      const startId = parseInt(startStr);
      const startNode = NODES.find(n => n.id === startId);
      if (!startNode) return;

      ends.forEach(endId => {
        const key = [startId, endId].sort().join('-');
        if (processed.has(key)) return;
        
        const endNode = NODES.find(n => n.id === endId);
        if (endNode) {
          lines.push({
            x1: startNode.x,
            y1: startNode.y,
            x2: endNode.x,
            y2: endNode.y,
            key
          });
          processed.add(key);
        }
      });
    });
    return lines;
  }, []);

  return (
    <div 
        className={`
            relative aspect-square bg-[#eaddcf] rounded-xl shadow-inner border-4 border-[#8d6e63] select-none mx-auto
            ${isFullScreen 
                ? 'w-full h-auto landscape:h-full landscape:w-auto max-w-[90vh]' 
                : 'w-full max-w-[500px]'
            }
        `}
    >
      {/* Lines Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {connections.map((line) => (
          <line
            key={line.key}
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke="#3e2723"
            strokeWidth="4"
            strokeLinecap="round"
          />
        ))}
      </svg>

      {/* Nodes Layer */}
      {NODES.map((node) => {
        const piece = board[node.id];
        const isSelected = selectedNode === node.id;
        const isValidMove = validMoves.includes(node.id);
        const isLastMoveSource = lastMove?.from === node.id;
        const isLastMoveDest = lastMove?.to === node.id;

        return (
          <div
            key={node.id}
            onClick={() => onNodeClick(node.id)}
            className={`
              absolute w-12 h-12 -ml-6 -mt-6 rounded-full flex items-center justify-center cursor-pointer z-10 transition-all duration-200
              ${isSelected ? 'bg-blue-500/30 ring-4 ring-blue-500/50' : ''}
              ${isValidMove ? 'bg-green-500/20' : 'hover:bg-white/20'}
              ${(isLastMoveSource || isLastMoveDest) && !piece ? 'bg-yellow-400/30' : ''}
            `}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            {/* Visual Indicator for Valid Move */}
            {isValidMove && (
              <div className="w-4 h-4 bg-green-500/80 rounded-full shadow-sm animate-pulse pointer-events-none" />
            )}

            {/* Render Piece */}
            {piece && (
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-2xl shadow-lg border-2 border-white/40 transition-transform duration-300
                  ${piece === 'tiger' ? 'bg-gradient-to-br from-orange-500 to-red-700' : 'bg-gradient-to-br from-yellow-300 to-orange-400'}
                  ${isSelected ? 'scale-110' : ''}
                  ${isLastMoveDest && !isSelected ? 'animate-bounce' : ''}
                `}
              >
                {visualMode === 'emoji' ? (
                  <span className="drop-shadow-md select-none">
                    {piece === 'tiger' ? '🐅' : '🐐'}
                  </span>
                ) : (
                  <div className={`w-5 h-5 rounded-full bg-white/60 shadow-inner`} />
                )}
              </div>
            )}
            
            {/* Hitbox area for easier tapping */}
            <div className="absolute inset-0 scale-150" />
          </div>
        );
      })}
    </div>
  );
};

export default Board;