import type { Tetromino, Position } from '../types/tetris';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export function createEmptyBoard(): (string | null)[][] {
  return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
}

export function isValidMove(
  board: (string | null)[][],
  tetromino: Tetromino,
  newPosition: Position
): boolean {
  for (let y = 0; y < tetromino.shape.length; y++) {
    for (let x = 0; x < tetromino.shape[y].length; x++) {
      if (tetromino.shape[y][x]) {
        const newX = newPosition.x + x;
        const newY = newPosition.y + y;

        // Check boundaries
        if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
          return false;
        }

        // Check collision with existing pieces (but allow moving through empty space above the board)
        if (newY >= 0 && board[newY][newX] !== null) {
          return false;
        }
      }
    }
  }
  return true;
}

export function placePiece(
  board: (string | null)[][],
  tetromino: Tetromino
): (string | null)[][] {
  const newBoard = board.map(row => [...row]);
  
  for (let y = 0; y < tetromino.shape.length; y++) {
    for (let x = 0; x < tetromino.shape[y].length; x++) {
      if (tetromino.shape[y][x]) {
        const boardY = tetromino.position.y + y;
        const boardX = tetromino.position.x + x;
        
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          newBoard[boardY][boardX] = tetromino.color;
        }
      }
    }
  }
  
  return newBoard;
}

export function clearLines(board: (string | null)[][]): {
  newBoard: (string | null)[][];
  linesCleared: number;
} {
  const fullLines: number[] = [];
  
  // Find full lines
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    if (board[y].every(cell => cell !== null)) {
      fullLines.push(y);
    }
  }
  
  if (fullLines.length === 0) {
    return { newBoard: board, linesCleared: 0 };
  }
  
  // Remove full lines and add empty lines at the top
  const newBoard = board.filter((_, index) => !fullLines.includes(index));
  const emptyLines = Array(fullLines.length).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
  
  return {
    newBoard: [...emptyLines, ...newBoard],
    linesCleared: fullLines.length,
  };
}

export function calculateScore(linesCleared: number, level: number): number {
  const baseScores = [0, 40, 100, 300, 1200];
  return baseScores[linesCleared] * (level + 1);
}

export function calculateLevel(totalLines: number): number {
  return Math.floor(totalLines / 10);
}

export function getDropSpeed(level: number): number {
  // Speed in milliseconds - gets faster as level increases
  return Math.max(50, 1000 - (level * 50));
}

export function getGhostPosition(
  board: (string | null)[][],
  tetromino: Tetromino
): Position {
  let ghostPosition = { ...tetromino.position };
  
  while (isValidMove(board, tetromino, { ...ghostPosition, y: ghostPosition.y + 1 })) {
    ghostPosition.y++;
  }
  
  return ghostPosition;
}