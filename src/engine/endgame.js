import { WHITE, BLACK, PAWN, KNIGHT, BISHOP, ROOK, QUEEN } from './const.js';
import { popcount, lsb } from './bitboard.js';

function dist(a, b) {
  return Math.max(Math.abs((a & 7) - (b & 7)), Math.abs((a >> 3) - (b >> 3)));
}
function manh(a, b) {
  return Math.abs((a & 7) - (b & 7)) + Math.abs((a >> 3) - (b >> 3));
}

export function endgameEval(pos) {
  const cnt = (c, p) => popcount(pos.bb[c][p]);
  const wk = lsb(pos.bb[WHITE][5]);
  const bk = lsb(pos.bb[BLACK][5]);
  const wP = cnt(WHITE, PAWN), bP = cnt(BLACK, PAWN);
  const wN = cnt(WHITE, KNIGHT), bN = cnt(BLACK, KNIGHT);
  const wB = cnt(WHITE, BISHOP), bB = cnt(BLACK, BISHOP);
  const wR = cnt(WHITE, ROOK), bR = cnt(BLACK, ROOK);
  const wQ = cnt(WHITE, QUEEN), bQ = cnt(BLACK, QUEEN);
  const wNon = wP + wN + wB + wR + wQ;
  const bNon = bP + bN + bB + bR + bQ;

  let special = 0;

  if ((wQ >= 1 || wR >= 1) && bNon === 0) {
    const edge = Math.min(bk & 7, 7 - (bk & 7), bk >> 3, 7 - (bk >> 3));
    special += 400 + (4 - edge) * 70 - dist(wk, bk) * 10;
  }
  if ((bQ >= 1 || bR >= 1) && wNon === 0) {
    const edge = Math.min(wk & 7, 7 - (wk & 7), wk >> 3, 7 - (wk >> 3));
    special -= 400 + (4 - edge) * 70 - dist(bk, wk) * 10;
  }

  if (wP === 1 && wNon === 1 && bNon === 0) {
    const ps = lsb(pos.bb[WHITE][PAWN]);
    const pr = ps >> 3;
    const pf = ps & 7;
    const promo = 56 + pf;
    special += pr * 18;
    if (manh(wk, promo) <= manh(bk, promo)) special += 45;
    if ((wk & 7) === pf) special += 12;
  }
  if (bP === 1 && bNon === 1 && wNon === 0) {
    const ps = lsb(pos.bb[BLACK][PAWN]);
    const pr = 7 - (ps >> 3);
    const pf = ps & 7;
    const promo = pf;
    special -= pr * 18;
    if (manh(bk, promo) <= manh(wk, promo)) special -= 45;
  }

  if (wN === 1 && wB === 1 && wNon === 2 && bNon === 0) {
    const bsq = lsb(pos.bb[WHITE][BISHOP]);
    const light = ((bsq & 7) + (bsq >> 3)) % 2 === 1;
    const c1 = light ? 7 : 0;
    const c2 = light ? 56 : 63;
    special += 220 - Math.min(dist(bk, c1), dist(bk, c2)) * 22;
  }
  if (bN === 1 && bB === 1 && bNon === 2 && wNon === 0) {
    const bsq = lsb(pos.bb[BLACK][BISHOP]);
    const light = ((bsq & 7) + (bsq >> 3)) % 2 === 1;
    const c1 = light ? 7 : 0;
    const c2 = light ? 56 : 63;
    special -= 220 - Math.min(dist(wk, c1), dist(wk, c2)) * 22;
  }

  return pos.side === WHITE ? special : -special;
}

export function isDrawnEndgame(pos) {
  const cnt = (c, p) => popcount(pos.bb[c][p]);
  if (cnt(WHITE, PAWN) + cnt(BLACK, PAWN) + cnt(WHITE, ROOK) + cnt(BLACK, ROOK) + cnt(WHITE, QUEEN) + cnt(BLACK, QUEEN)) {
    return false;
  }
  const wmin = cnt(WHITE, KNIGHT) + cnt(WHITE, BISHOP);
  const bmin = cnt(BLACK, KNIGHT) + cnt(BLACK, BISHOP);
  if (wmin <= 1 && bmin <= 1) return true;
  if (wmin === 2 && cnt(WHITE, KNIGHT) === 2 && bmin === 0) return true;
  if (bmin === 2 && cnt(BLACK, KNIGHT) === 2 && wmin === 0) return true;
  return false;
}
