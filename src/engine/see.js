import { PAWN, KING } from './const.js';
import { bit, lsb, KNIGHT_ATK, KING_ATK, PAWN_ATK, bishopAttacks, rookAttacks } from './bitboard.js';
import { moveFrom, moveTo, movePromo, moveFlags, MF_EP } from './position.js';
import { PIECE_VAL } from './const.js';

function attackers(pos, sq, occ) {
  let a = 0n;
  a |= PAWN_ATK[1][sq] & pos.bb[0][PAWN];
  a |= PAWN_ATK[0][sq] & pos.bb[1][PAWN];
  a |= KNIGHT_ATK[sq] & (pos.bb[0][1] | pos.bb[1][1]);
  a |= KING_ATK[sq] & (pos.bb[0][5] | pos.bb[1][5]);
  a |= bishopAttacks(sq, occ) & (pos.bb[0][2] | pos.bb[1][2] | pos.bb[0][4] | pos.bb[1][4]);
  a |= rookAttacks(sq, occ) & (pos.bb[0][3] | pos.bb[1][3] | pos.bb[0][4] | pos.bb[1][4]);
  return a & occ;
}

function minAttacker(pos, att, side) {
  for (let p = PAWN; p <= KING; p++) {
    const s = att & pos.bb[side][p];
    if (s) return { sq: lsb(s), type: p };
  }
  return null;
}

export function see(pos, m) {
  const from = moveFrom(m);
  const to = moveTo(m);
  const flags = moveFlags(m);
  const us0 = pos.side;
  const attacker = pos.pieceOn(from);
  if (!attacker) return 0;
  let victim = pos.pieceOn(to);
  if (flags & MF_EP) victim = { type: PAWN };
  const gain = [];
  gain[0] = victim ? PIECE_VAL[victim.type] : 0;
  if (movePromo(m)) gain[0] += PIECE_VAL[movePromo(m) === 4 ? 4 : movePromo(m)] - PIECE_VAL[PAWN];

  let occ = pos.all ^ bit(from);
  if (flags & MF_EP) occ ^= bit(us0 === 0 ? to - 8 : to + 8);
  let att = attackers(pos, to, occ);
  let side = us0 ^ 1;
  let d = 1;
  let piece = attacker.type;
  if (movePromo(m)) piece = movePromo(m) === 4 ? 4 : [0, 1, 2, 3, 4][movePromo(m)];

  while (true) {
    const next = minAttacker(pos, att, side);
    if (!next) break;
    occ ^= bit(next.sq);
    att = attackers(pos, to, occ);
    gain[d] = PIECE_VAL[piece] - gain[d - 1];
    piece = next.type;
    d++;
    side ^= 1;
    if (d > 16) break;
  }

  while (--d) {
    gain[d - 1] = -Math.max(-gain[d - 1], gain[d]);
  }
  return gain[0];
}

export function seeGe(pos, m, threshold = 0) {
  return see(pos, m) >= threshold;
}
