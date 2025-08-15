import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameState, Tetromino } from '../types/tetris';
import {
  createEmptyBoard,
  isValidMove,
  placePiece,
  clearLines,
  calculateScore,
  calculateLevel,
  getDropSpeed,
} from '../utils/gameLogic';
import {
  createTetromino,
  rotateTetromino,
  getRandomTetrominoType,
} from '../utils/tetrominoes';

export function useTetris() {
  const [gameState, setGameState] = useState<GameState>(() => ({
    board: createEmptyBoard(),
    currentPiece: null,
    nextPiece: null,
    score: 0,
    level: 0,
    lines: 0,
    isGameOver: false,
    isPaused: false,
  }));

  const dropTimer = useRef<NodeJS.Timeout | null>(null);
  const gameStarted = useRef(false);

  const generateNewPiece = useCallback((): Tetromino => {
    return createTetromino(getRandomTetrominoType());
  }, []);

  const initializeGame = useCallback(() => {
    const firstPiece = generateNewPiece();
    const secondPiece = generateNewPiece();
    
    setGameState({
      board: createEmptyBoard(),
      currentPiece: firstPiece,
      nextPiece: secondPiece,
      score: 0,
      level: 0,
      lines: 0,
      isGameOver: false,
      isPaused: false,
    });
    gameStarted.current = true;
  }, [generateNewPiece]);

  const movePiece = useCallback((dx: number, dy: number) => {
    setGameState(prev => {
      if (!prev.currentPiece || prev.isGameOver || prev.isPaused) return prev;

      const newPosition = {
        x: prev.currentPiece.position.x + dx,
        y: prev.currentPiece.position.y + dy,
      };

      if (isValidMove(prev.board, prev.currentPiece, newPosition)) {
        return {
          ...prev,
          currentPiece: {
            ...prev.currentPiece,
            position: newPosition,
          },
        };
      }

      return prev;
    });
  }, []);

  const rotatePiece = useCallback(() => {
    setGameState(prev => {
      if (!prev.currentPiece || prev.isGameOver || prev.isPaused) return prev;

      const rotatedPiece = rotateTetromino(prev.currentPiece);

      if (isValidMove(prev.board, rotatedPiece, rotatedPiece.position)) {
        return {
          ...prev,
          currentPiece: rotatedPiece,
        };
      }

      // Try wall kicks
      const kicks = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: -1 },
        { x: 2, y: 0 },
        { x: -2, y: 0 },
      ];

      for (const kick of kicks) {
        const kickedPosition = {
          x: rotatedPiece.position.x + kick.x,
          y: rotatedPiece.position.y + kick.y,
        };

        if (isValidMove(prev.board, rotatedPiece, kickedPosition)) {
          return {
            ...prev,
            currentPiece: {
              ...rotatedPiece,
              position: kickedPosition,
            },
          };
        }
      }

      return prev;
    });
  }, []);

  const hardDrop = useCallback(() => {
    setGameState(prev => {
      if (!prev.currentPiece || prev.isGameOver || prev.isPaused) return prev;

      let dropDistance = 0;
      let newPosition = { ...prev.currentPiece.position };

      while (isValidMove(prev.board, prev.currentPiece, { ...newPosition, y: newPosition.y + 1 })) {
        newPosition.y++;
        dropDistance++;
      }

      return {
        ...prev,
        currentPiece: {
          ...prev.currentPiece,
          position: newPosition,
        },
        score: prev.score + dropDistance * 2, // Bonus points for hard drop
      };
    });
  }, []);

  const dropPiece = useCallback(() => {
    setGameState(prev => {
      if (!prev.currentPiece || prev.isGameOver || prev.isPaused) return prev;

      const newPosition = {
        x: prev.currentPiece.position.x,
        y: prev.currentPiece.position.y + 1,
      };

      if (isValidMove(prev.board, prev.currentPiece, newPosition)) {
        return {
          ...prev,
          currentPiece: {
            ...prev.currentPiece,
            position: newPosition,
          },
        };
      }

      // Piece can't move down, place it
      const newBoard = placePiece(prev.board, prev.currentPiece);
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
      
      const newLines = prev.lines + linesCleared;
      const newLevel = calculateLevel(newLines);
      const scoreIncrease = calculateScore(linesCleared, prev.level);

      const nextPiece = createTetromino(getRandomTetrominoType());

      // Check if game is over
      const isGameOver = !isValidMove(clearedBoard, prev.nextPiece!, prev.nextPiece!.position);

      return {
        ...prev,
        board: clearedBoard,
        currentPiece: isGameOver ? null : prev.nextPiece,
        nextPiece: isGameOver ? null : nextPiece,
        score: prev.score + scoreIncrease,
        level: newLevel,
        lines: newLines,
        isGameOver,
      };
    });
  }, []);

  const togglePause = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, []);

  const resetGame = useCallback(() => {
    initializeGame();
  }, [initializeGame]);

  // Auto-drop timer
  useEffect(() => {
    if (!gameStarted.current || gameState.isGameOver || gameState.isPaused) {
      if (dropTimer.current) {
        clearInterval(dropTimer.current);
        dropTimer.current = null;
      }
      return;
    }

    const speed = getDropSpeed(gameState.level);
    dropTimer.current = setInterval(dropPiece, speed);

    return () => {
      if (dropTimer.current) {
        clearInterval(dropTimer.current);
      }
    };
  }, [gameState.level, gameState.isGameOver, gameState.isPaused, dropPiece]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!gameStarted.current || gameState.isGameOver) return;

      switch (event.code) {
        case 'ArrowLeft':
          event.preventDefault();
          movePiece(-1, 0);
          break;
        case 'ArrowRight':
          event.preventDefault();
          movePiece(1, 0);
          break;
        case 'ArrowDown':
          event.preventDefault();
          movePiece(0, 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          rotatePiece();
          break;
        case 'Space':
          event.preventDefault();
          hardDrop();
          break;
        case 'KeyP':
          event.preventDefault();
          togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePiece, rotatePiece, hardDrop, togglePause, gameState.isGameOver]);

  return {
    gameState,
    initializeGame,
    resetGame,
    togglePause,
    movePiece,
    rotatePiece,
    hardDrop,
  };
}