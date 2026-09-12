import { WHITE, BLACK, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING, PIECE_VAL } from './const.js';
import { bit, popcount, lsb, KNIGHT_ATK, KING_ATK, PAWN_ATK, bishopAttacks, rookAttacks, queenAttacks } from './bitboard.js';
import { endgameEval, isDrawnEndgame } from './endgame.js';
import { nnueEval } from './nnue.js';
import { kpkScore } from './kpk.js';
import { tbScore } from './tb.js';

export { PIECE_VAL } from './const.js';

const PST_MG = [
  // pawn
  [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  // knight
  [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  // bishop
  [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  // rook
  [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     0,  0,  0,  5,  5,  0,  0,  0,
  ],
  // queen
  [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20,
  ],
  // king
  [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20,
  ],
];

const PST_EG = [
  [
     0,  0,  0,  0,  0,  0,  0,  0,
    80, 80, 80, 80, 80, 80, 80, 80,
    50, 50, 50, 50, 50, 50, 50, 50,
    30, 30, 30, 30, 30, 30, 30, 30,
    20, 20, 20, 20, 20, 20, 20, 20,
    10, 10, 10, 10, 10, 10, 10, 10,
     0,  0,  0,  0,  0,  0,  0,  0,
     0,  0,  0,  0,  0,  0,  0,  0,
  ],
  PST_MG[1],
  PST_MG[2],
  PST_MG[3],
  PST_MG[4],
  [
    -50,-40,-30,-20,-20,-30,-40,-50,
    -30,-20,-10,  0,  0,-10,-20,-30,
    -30,-10, 20, 30, 30, 20,-10,-30,
    -30,-10, 30, 40, 40, 30,-10,-30,
    -30,-10, 30, 40, 40, 30,-10,-30,
    -30,-10, 20, 30, 30, 20,-10,-30,
    -30,-30,  0,  0,  0,  0,-30,-30,
    -50,-30,-30,-30,-30,-30,-30,-50,
  ],
];

function mirror(sq) {
  return sq ^ 56;
}

const PHASE = [0, 1, 1, 2, 4, 0];

export function evaluate(pos) {
  if (isDrawnEndgame(pos)) return 0;
  const tb = tbScore(pos);
  if (tb != null) return tb;
  let mg = 0, eg = 0, phase = 0;
  for (let c = 0; c < 2; c++) {
    const sign = c === WHITE ? 1 : -1;
    for (let p = 0; p < 6; p++) {
      let bb = pos.bb[c][p];
      while (bb) {
        const sq = lsb(bb);
        bb ^= bit(sq);
        const idx = c === WHITE ? mirror(sq) : sq;
        mg += sign * (PIECE_VAL[p] + PST_MG[p][idx]);
        eg += sign * (PIECE_VAL[p] + PST_EG[p][idx]);
        phase += PHASE[p];
      }
    }
  }

  const occ = pos.all;
  for (let c = 0; c < 2; c++) {
    const sign = c === WHITE ? 1 : -1;
    const enemy = c ^ 1;
    let kn = pos.bb[c][KNIGHT];
    while (kn) {
      const sq = lsb(kn); kn ^= bit(sq);
      const mob = popcount(KNIGHT_ATK[sq] & ~pos.occ[c]);
      mg += sign * mob * 4;
      eg += sign * mob * 4;
    }
    let bi = pos.bb[c][BISHOP];
    if (popcount(bi) >= 2) { mg += sign * 30; eg += sign * 50; }
    while (bi) {
      const sq = lsb(bi); bi ^= bit(sq);
      const mob = popcount(bishopAttacks(sq, occ) & ~pos.occ[c]);
      mg += sign * mob * 3;
      eg += sign * mob * 3;
    }
    let rk = pos.bb[c][ROOK];
    while (rk) {
      const sq = lsb(rk); rk ^= bit(sq);
      const mob = popcount(rookAttacks(sq, occ) & ~pos.occ[c]);
      mg += sign * mob * 2;
      eg += sign * mob * 3;
      const file = 0x0101010101010101n << BigInt(sq & 7);
      if (!(pos.bb[c][PAWN] & file)) {
        mg += sign * 15;
        if (!(pos.bb[enemy][PAWN] & file)) mg += sign * 15;
      }
    }
    let qn = pos.bb[c][QUEEN];
    while (qn) {
      const sq = lsb(qn); qn ^= bit(sq);
      const mob = popcount(queenAttacks(sq, occ) & ~pos.occ[c]);
      mg += sign * mob * 1;
      eg += sign * mob * 2;
    }

    const ksq = lsb(pos.bb[c][KING]);
    const shieldRank = c === WHITE ? (ksq >> 3) + 1 : (ksq >> 3) - 1;
    if (shieldRank >= 0 && shieldRank < 8) {
      const kf = ksq & 7;
      for (let f = Math.max(0, kf - 1); f <= Math.min(7, kf + 1); f++) {
        const sqs = shieldRank * 8 + f;
        if (pos.bb[c][PAWN] & bit(sqs)) mg += sign * 12;
      }
    }
    const katt = popcount(KING_ATK[ksq] & (pos.bb[enemy][QUEEN] | pos.bb[enemy][ROOK] | pos.bb[enemy][KNIGHT] | pos.bb[enemy][BISHOP]));
    mg -= sign * katt * 8;

    if (c === WHITE) {
      if (pos.castle & 1) mg += 12;
      if (pos.castle & 2) mg += 8;
    } else {
      if (pos.castle & 4) mg += 12;
      if (pos.castle & 8) mg += 8;
    }

    let rk2 = pos.bb[c][ROOK];
    while (rk2) {
      const sq = lsb(rk2); rk2 ^= bit(sq);
      const rank = sq >> 3;
      if ((c === WHITE && rank === 6) || (c === BLACK && rank === 1)) {
        mg += sign * 20;
        eg += sign * 30;
      }
    }

    let kn2 = pos.bb[c][KNIGHT];
    while (kn2) {
      const sq = lsb(kn2); kn2 ^= bit(sq);
      const r = c === WHITE ? (sq >> 3) : 7 - (sq >> 3);
      if (r >= 4) {
        const f = sq & 7;
        const support = PAWN_ATK[c ^ 1][sq] & pos.bb[c][PAWN];
        if (support) { mg += sign * 18; eg += sign * 10; }
      }
    }

    let pawns = pos.bb[c][PAWN];
    while (pawns) {
      const sq = lsb(pawns); pawns ^= bit(sq);
      const file = sq & 7;
      const fileMask = 0x0101010101010101n << BigInt(file);
      const adj = (file > 0 ? 0x0101010101010101n << BigInt(file - 1) : 0n) |
                  (file < 7 ? 0x0101010101010101n << BigInt(file + 1) : 0n);
      if (popcount(pos.bb[c][PAWN] & fileMask) > 1) { mg -= sign * 12; eg -= sign * 20; }
      if (!(pos.bb[c][PAWN] & adj)) { mg -= sign * 10; eg -= sign * 18; }
      const ahead = c === WHITE
        ? ((~0n) << BigInt(sq + 8)) & (fileMask | adj)
        : (((1n << BigInt(sq)) - 1n) & (fileMask | adj));
      if (!(pos.bb[enemy][PAWN] & ahead & fileMask) && !(pos.bb[enemy][PAWN] & ahead & adj & ~fileMask) === false) {
        /* skip messy */
      }
      const front = c === WHITE ? (~0n << BigInt(sq + 8)) & fileMask : ((1n << BigInt(sq)) - 1n) & fileMask;
      const adjFront = c === WHITE ? (~0n << BigInt(sq)) & adj : ((1n << BigInt(sq + 1)) - 1n) & adj;
      if (!(pos.bb[enemy][PAWN] & front) && !(pos.bb[enemy][PAWN] & adjFront)) {
        const rank = c === WHITE ? (sq >> 3) : 7 - (sq >> 3);
        const bonus = [0, 5, 10, 20, 35, 55, 90, 0][rank];
        mg += sign * bonus;
        eg += sign * bonus * 2;
      }
    }
  }

  if (phase > 24) phase = 24;
  let score = ((mg * phase) + (eg * (24 - phase))) / 24 | 0;
  if (pos.side === BLACK) score = -score;
  if (phase <= 8) score += endgameEval(pos);
  score += (kpkScore(pos) * (24 - phase)) / 24 | 0;
  const nn = nnueEval(pos);
  score = (score * 5 + nn) / 6 | 0;
  return score;
}

export function explainEval(pos) {
  return {
    side: pos.side,
    score: evaluate(pos),
    fen: pos.fen(),
  };
}
