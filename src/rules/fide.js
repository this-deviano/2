import { Position } from '../engine/position.js';

export const RESULT = {
  ONGOING: '*',
  WHITE: '1-0',
  BLACK: '0-1',
  DRAW: '1/2-1/2',
};

export function gameResult(pos, { timedOutSide = null } = {}) {
  if (timedOutSide === 0) return { result: RESULT.BLACK, reason: 'White lost on time' };
  if (timedOutSide === 1) return { result: RESULT.WHITE, reason: 'Black lost on time' };
  const legal = pos.legalMoves();
  if (!legal.length) {
    if (pos.inCheck()) {
      return pos.side === 0
        ? { result: RESULT.BLACK, reason: 'checkmate' }
        : { result: RESULT.WHITE, reason: 'checkmate' };
    }
    return { result: RESULT.DRAW, reason: 'stalemate' };
  }
  if (pos.halfmove >= 100) return { result: RESULT.DRAW, reason: '50-move rule' };
  if (pos.isRepetition()) return { result: RESULT.DRAW, reason: 'threefold repetition' };
  if (pos.insufficientMaterial()) return { result: RESULT.DRAW, reason: 'insufficient material' };
  return { result: RESULT.ONGOING, reason: 'play' };
}

export const LAWS = {
  1: 'The game is played by two opponents who move alternately on a square board of 64 squares.',
  2: 'The chessboard is composed of 64 equal squares, 32 light and 32 dark.',
  3: 'The pieces: king, queen, rook, bishop, knight, pawn — each with its own move.',
  4: 'The act of moving: a player may move a piece to a vacant square or capture.',
  5: 'Completion: checkmate, resignation, agreed draw, stalemate, repetition, 50-move, dead position.',
};
