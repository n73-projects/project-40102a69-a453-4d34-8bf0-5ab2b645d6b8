import { useTetris } from '../hooks/useTetris';
import { getGhostPosition } from '../utils/gameLogic';
import { Button } from './ui/button';
import type { Tetromino } from '../types/tetris';

interface CellProps {
  color?: string | null;
  isGhost?: boolean;
}

function Cell({ color, isGhost }: CellProps) {
  const baseClasses = "w-6 h-6 border border-gray-800";
  
  if (isGhost) {
    return (
      <div 
        className={`${baseClasses} border-2 border-dashed opacity-50`}
        style={{ borderColor: color || '#666' }}
      />
    );
  }
  
  if (color) {
    return (
      <div 
        className={`${baseClasses} shadow-inner`}
        style={{ backgroundColor: color }}
      />
    );
  }
  
  return <div className={`${baseClasses} bg-gray-900`} />;
}

interface TetrominoPreviewProps {
  tetromino: Tetromino | null;
}

function TetrominoPreview({ tetromino }: TetrominoPreviewProps) {
  if (!tetromino) {
    return (
      <div className="w-24 h-24 bg-gray-900 border border-gray-700 rounded flex items-center justify-center">
        <span className="text-gray-500 text-sm">Next</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-2">
      <div className="text-white text-sm mb-2 text-center">Next</div>
      <div className="grid gap-0.5" style={{ 
        gridTemplateColumns: `repeat(${tetromino.shape[0].length}, 1fr)` 
      }}>
        {tetromino.shape.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${y}-${x}`}
              className="w-4 h-4 border border-gray-800"
              style={{
                backgroundColor: cell ? tetromino.color : 'transparent',
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function TetrisGame() {
  const { gameState, initializeGame, resetGame, togglePause } = useTetris();

  const renderBoard = () => {
    // Create a copy of the board to render
    const displayBoard = gameState.board.map(row => [...row]);
    
    // Add current piece
    if (gameState.currentPiece) {
      for (let y = 0; y < gameState.currentPiece.shape.length; y++) {
        for (let x = 0; x < gameState.currentPiece.shape[y].length; x++) {
          if (gameState.currentPiece.shape[y][x]) {
            const boardY = gameState.currentPiece.position.y + y;
            const boardX = gameState.currentPiece.position.x + x;
            
            if (
              boardY >= 0 && 
              boardY < displayBoard.length && 
              boardX >= 0 && 
              boardX < displayBoard[0].length
            ) {
              displayBoard[boardY][boardX] = gameState.currentPiece.color;
            }
          }
        }
      }
    }

    // Add ghost piece
    const ghostCells = new Set<string>();
    if (gameState.currentPiece) {
      const ghostPosition = getGhostPosition(gameState.board, gameState.currentPiece);
      for (let y = 0; y < gameState.currentPiece.shape.length; y++) {
        for (let x = 0; x < gameState.currentPiece.shape[y].length; x++) {
          if (gameState.currentPiece.shape[y][x]) {
            const boardY = ghostPosition.y + y;
            const boardX = ghostPosition.x + x;
            
            if (
              boardY >= 0 && 
              boardY < displayBoard.length && 
              boardX >= 0 && 
              boardX < displayBoard[0].length &&
              !displayBoard[boardY][boardX] // Only show ghost if cell is empty
            ) {
              ghostCells.add(`${boardY}-${boardX}`);
            }
          }
        }
      }
    }

    return displayBoard.map((row, y) =>
      row.map((cell, x) => {
        const isGhost = ghostCells.has(`${y}-${x}`);
        return (
          <Cell
            key={`${y}-${x}`}
            color={cell || (isGhost ? gameState.currentPiece?.color : null)}
            isGhost={isGhost}
          />
        );
      })
    );
  };

  if (!gameState.currentPiece && !gameState.isGameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <h1 className="text-4xl font-bold mb-8 text-cyan-400">TETRIS</h1>
        <div className="text-center mb-8">
          <p className="mb-2">Controls:</p>
          <p className="text-sm text-gray-400">← → : Move</p>
          <p className="text-sm text-gray-400">↑ : Rotate</p>
          <p className="text-sm text-gray-400">↓ : Soft Drop</p>
          <p className="text-sm text-gray-400">Space : Hard Drop</p>
          <p className="text-sm text-gray-400">P : Pause</p>
        </div>
        <Button 
          onClick={initializeGame}
          className="px-8 py-4 text-lg bg-cyan-600 hover:bg-cyan-700"
        >
          Start Game
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <h1 className="text-3xl font-bold mb-4 text-cyan-400">TETRIS</h1>
      
      <div className="flex gap-8 items-start">
        {/* Game Board */}
        <div className="relative">
          <div 
            className="grid gap-0 border-2 border-gray-600 bg-gray-950"
            style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}
          >
            {renderBoard()}
          </div>
          
          {/* Game Over Overlay */}
          {gameState.isGameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-red-400 mb-4">GAME OVER</h2>
                <Button 
                  onClick={resetGame}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  Play Again
                </Button>
              </div>
            </div>
          )}
          
          {/* Pause Overlay */}
          {gameState.isPaused && !gameState.isGameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">PAUSED</h2>
                <p className="text-gray-400">Press P to resume</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Side Panel */}
        <div className="flex flex-col gap-6">
          {/* Next Piece */}
          <TetrominoPreview tetromino={gameState.nextPiece} />
          
          {/* Stats */}
          <div className="bg-gray-900 border border-gray-700 rounded p-4 min-w-32">
            <div className="text-center space-y-2">
              <div>
                <div className="text-sm text-gray-400">Score</div>
                <div className="text-lg font-bold text-cyan-400">
                  {gameState.score.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Level</div>
                <div className="text-lg font-bold text-yellow-400">
                  {gameState.level}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Lines</div>
                <div className="text-lg font-bold text-green-400">
                  {gameState.lines}
                </div>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="bg-gray-900 border border-gray-700 rounded p-4">
            <div className="space-y-2">
              <Button 
                onClick={togglePause}
                variant="outline"
                className="w-full"
                disabled={gameState.isGameOver}
              >
                {gameState.isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button 
                onClick={resetGame}
                variant="outline" 
                className="w-full"
              >
                Reset
              </Button>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="bg-gray-900 border border-gray-700 rounded p-4 text-xs">
            <div className="text-center text-gray-400">
              <p>← → Move</p>
              <p>↑ Rotate</p>
              <p>↓ Soft Drop</p>
              <p>Space Hard Drop</p>
              <p>P Pause</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}