/** King+pawn vs king: rule-of-the-square, opposition, and rook-pawn traps. */
import { lsb } from './bitboard.js';
import { WHITE, PAWN } from './const.js';

function dist(a, b) {
  return Math.max(Math.abs((a & 7) - (b & 7)), Math.abs((a >> 3) - (b >> 3)));
}

export function kpkScore(pos) {
  const wP = pos.bb[0][PAWN];
  const bP = pos.bb[1][PAWN];
  const wN = pos.occ[0] ^ pos.bb[0][5] ^ wP;
  const bN = pos.occ[1] ^ pos.bb[1][5] ^ bP;
  if (wN || bN) return 0;
  const wp = wP && !bP;
  const bp = bP && !wP;
  if (!wp && !bp) return 0;
  const us = wp ? WHITE : 1;
  const pawn = lsb(wp ? wP : bP);
  const kUs = lsb(pos.bb[us][5]);
  const kThem = lsb(pos.bb[us ^ 1][5]);
  const file = pawn & 7;
  const rank = pawn >> 3;
  const promo = us === WHITE ? 56 + file : file;
  const steps = us === WHITE ? 7 - rank : rank;
  const stm = pos.side === us;
  const kThemToPromo = dist(kThem, promo);
  const inSquare = kThemToPromo <= steps + (stm ? 0 : 1);
  let s = 40 + rank * (us === WHITE ? 8 : -8);
  if (file === 0 || file === 7) {
    const corner = promo;
    if (dist(kThem, corner) <= 1 && dist(kUs, corner) > 2) s = 8;
  }
  if (!inSquare) s += 80;
  else s -= 20;
  if (dist(kUs, pawn) === 1) s += 15;
  return us === WHITE ? s : -s;
}
