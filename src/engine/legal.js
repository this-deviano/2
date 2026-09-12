import {
  WHITE, BLACK, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING,
  CASTLE_WK, CASTLE_WQ, CASTLE_BK, CASTLE_BQ, sqRank,
  PROMO_QUEEN, PROMO_ROOK, PROMO_BISHOP, PROMO_KNIGHT,
} from './const.js';
import {
  bit, lsb, KNIGHT_ATK, KING_ATK, PAWN_ATK,
  bishopAttacks, rookAttacks, queenAttacks, between,
} from './bitboard.js';
import { encodeMove, MF_CAPTURE, MF_EP, MF_CASTLE, MF_DPUSH } from './position.js';

/** Fast-ish legal generator: still validates king safety for EP/castle/pins via make-free king attacks. */
export function genLegal(pos) {
  return pos.legalMoves();
}

export function checkers(pos, side = pos.side) {
  const k = lsb(pos.bb[side][KING]);
  if (k < 0) return 0n;
  return pos.attackersTo(k, side ^ 1);
}

export function pinned(pos, side = pos.side) {
  const k = lsb(pos.bb[side][KING]);
  const them = side ^ 1;
  let pins = 0n;
  const sliders = pos.bb[them][BISHOP] | pos.bb[them][QUEEN] | pos.bb[them][ROOK];
  let s = sliders;
  while (s) {
    const sq = lsb(s);
    s ^= bit(sq);
    const b = between(k, sq);
    if (!b) continue;
    const block = b & pos.all;
    if (block && !(block & (block - 1n)) && (block & pos.occ[side])) pins |= block;
  }
  return pins;
}
