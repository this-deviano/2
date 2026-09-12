import { lsb, bit, popcount, KNIGHT_ATK, KING_ATK, PAWN_ATK, bishopAttacks, rookAttacks, queenAttacks } from './bitboard.js';
import { PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING } from './const.js';

export function attacksFrom(pos, color) {
  const occ = pos.all;
  let a = 0n;
  let p = pos.bb[color][PAWN];
  while (p) { const s = lsb(p); p ^= bit(s); a |= PAWN_ATK[color][s]; }
  let n = pos.bb[color][KNIGHT];
  while (n) { const s = lsb(n); n ^= bit(s); a |= KNIGHT_ATK[s]; }
  let b = pos.bb[color][BISHOP];
  while (b) { const s = lsb(b); b ^= bit(s); a |= bishopAttacks(s, occ); }
  let r = pos.bb[color][ROOK];
  while (r) { const s = lsb(r); r ^= bit(s); a |= rookAttacks(s, occ); }
  let q = pos.bb[color][QUEEN];
  while (q) { const s = lsb(q); q ^= bit(s); a |= queenAttacks(s, occ); }
  const k = lsb(pos.bb[color][KING]);
  if (k >= 0) a |= KING_ATK[k];
  return a;
}

export function squareControl(pos) {
  const w = attacksFrom(pos, 0);
  const b = attacksFrom(pos, 1);
  const map = new Int8Array(64);
  for (let s = 0; s < 64; s++) {
    const bitset = 1n << BigInt(s);
    map[s] = (w & bitset ? 1 : 0) - (b & bitset ? 1 : 0);
  }
  return { white: popcount(w), black: popcount(b), map };
}

export function hangingPieces(pos, color) {
  const them = color ^ 1;
  const ours = pos.occ[color];
  const theirAtk = attacksFrom(pos, them);
  const ourAtk = attacksFrom(pos, color);
  const hang = [];
  let x = ours;
  while (x) {
    const s = lsb(x);
    x ^= bit(s);
    const b = bit(s);
    if ((theirAtk & b) && !(ourAtk & b) && pos.pieceOn(s)?.type !== KING) hang.push(s);
  }
  return hang;
}
