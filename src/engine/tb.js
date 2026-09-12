import { popcount, lsb } from './bitboard.js';
import { PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING } from './const.js';

function n(pos, c, p) { return popcount(pos.bb[c][p]); }

/** 3-man WDL: 2 win, 1 cursed-ish, 0 draw, -2 loss from side to move. */
export function probeTb(pos) {
  const pieces = popcount(pos.all);
  if (pieces > 3) return null;
  const wQ = n(pos, 0, QUEEN), bQ = n(pos, 1, QUEEN);
  const wR = n(pos, 0, ROOK), bR = n(pos, 1, ROOK);
  const wP = n(pos, 0, PAWN), bP = n(pos, 1, PAWN);
  const wN = n(pos, 0, KNIGHT) + n(pos, 0, BISHOP);
  const bN = n(pos, 1, KNIGHT) + n(pos, 1, BISHOP);
  if (pieces === 2) return 0;
  if (wQ && !bQ && !bR && !bP && !bN) return pos.side === 0 ? 2 : -2;
  if (bQ && !wQ && !wR && !wP && !wN) return pos.side === 0 ? -2 : 2;
  if (wR && !bR && !bQ && !bP && !bN) return pos.side === 0 ? 2 : -2;
  if (bR && !wR && !wQ && !wP && !wN) return pos.side === 0 ? -2 : 2;
  if (wN === 1 && pieces === 3 && !wP && !bP) return 0;
  if (bN === 1 && pieces === 3 && !wP && !bP) return 0;
  if (wP === 1 && pieces === 3) return null;
  if (bP === 1 && pieces === 3) return null;
  return null;
}

export function tbScore(pos) {
  const w = probeTb(pos);
  if (w == null) return null;
  if (w === 2) return 18000;
  if (w === -2) return -18000;
  return 0;
}
