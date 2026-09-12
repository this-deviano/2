import { KNIGHT, BISHOP, ROOK, QUEEN, KING, sqName, sqFile, sqRank } from './const.js';
import { moveFrom, moveTo, movePromo, moveFlags, MF_CASTLE, MF_CAPTURE, MF_EP } from './position.js';

const LETTER = ['', 'N', 'B', 'R', 'Q', 'K'];
const PROMO_L = ['', 'N', 'B', 'R', 'Q'];

export function moveToSan(pos, m) {
  const flags = moveFlags(m);
  if (flags & MF_CASTLE) {
    const to = moveTo(m);
    return (to === 6 || to === 62) ? 'O-O' : 'O-O-O';
  }
  const from = moveFrom(m);
  const to = moveTo(m);
  const pc = pos.pieceOn(from);
  if (!pc) return sqName(from) + sqName(to);
  const cap = (flags & (MF_CAPTURE | MF_EP)) || pos.pieceOn(to);
  let s = LETTER[pc.type];
  if (pc.type === 0 && cap) s += 'abcdefgh'[sqFile(from)];

  if (pc.type !== 0) {
    const others = pos.legalMoves().filter((x) => {
      if (x === m) return false;
      if (moveTo(x) !== to || movePromo(x) !== movePromo(m)) return false;
      const p2 = pos.pieceOn(moveFrom(x));
      return p2 && p2.type === pc.type;
    });
    if (others.length) {
      const sameFile = others.some((x) => sqFile(moveFrom(x)) === sqFile(from));
      const sameRank = others.some((x) => sqRank(moveFrom(x)) === sqRank(from));
      if (!sameFile) s += 'abcdefgh'[sqFile(from)];
      else if (!sameRank) s += String(1 + sqRank(from));
      else s += sqName(from);
    }
  }

  if (cap) s += 'x';
  s += sqName(to);
  if (movePromo(m)) s += '=' + PROMO_L[movePromo(m)];

  pos.makeMove(m);
  const check = pos.inCheck();
  const mate = check && pos.legalMoves().length === 0;
  pos.undoMove();
  if (mate) s += '#';
  else if (check) s += '+';
  return s;
}

export function parseSan(pos, san) {
  const clean = san.replace(/[+#?!]/g, '');
  const legal = pos.legalMoves();
  if (clean === 'O-O' || clean === '0-0') {
    return legal.find((m) => (moveFlags(m) & MF_CASTLE) && (moveTo(m) === 6 || moveTo(m) === 62)) || 0;
  }
  if (clean === 'O-O-O' || clean === '0-0-0') {
    return legal.find((m) => (moveFlags(m) & MF_CASTLE) && (moveTo(m) === 2 || moveTo(m) === 58)) || 0;
  }
  for (const m of legal) {
    if (moveToSan(pos, m).replace(/[+#]/g, '') === clean) return m;
  }
  const m2 = clean.match(/^([NBRQK])?([a-h])?([1-8])?x?([a-h][1-8])(?:=?([NBRQ]))?$/);
  if (!m2) return 0;
  const type = m2[1] ? ' PNBRQK'.indexOf(m2[1]) : 0;
  const ff = m2[2] ? m2[2].charCodeAt(0) - 97 : -1;
  const fr = m2[3] ? +m2[3] - 1 : -1;
  const to = (m2[4].charCodeAt(0) - 97) + 8 * (m2[4].charCodeAt(1) - 49);
  const promo = m2[5] ? { N: 1, B: 2, R: 3, Q: 4 }[m2[5]] : 0;
  for (const m of legal) {
    if (moveTo(m) !== to) continue;
    if (movePromo(m) !== promo) continue;
    const pc = pos.pieceOn(moveFrom(m));
    if (!pc || pc.type !== type) continue;
    if (ff >= 0 && (moveFrom(m) & 7) !== ff) continue;
    if (fr >= 0 && (moveFrom(m) >> 3) !== fr) continue;
    return m;
  }
  return 0;
}
