export const ONE = 1n;

export function bit(sq) {
  return 1n << BigInt(sq);
}

export function lsb(bb) {
  if (bb === 0n) return -1;
  const t = bb & -bb;
  return t.toString(2).length - 1;
}

export function popLsb(state) {
  const b = state.bb & -state.bb;
  const sq = b.toString(2).length - 1;
  state.bb ^= b;
  return sq;
}

export function popcount(bb) {
  let n = 0;
  while (bb) {
    bb &= bb - 1n;
    n++;
  }
  return n;
}

export function several(bb) {
  return (bb & (bb - 1n)) !== 0n;
}

const KNIGHT_OFF = [
  [1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1],
];
const KING_OFF = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1],
];

export const KNIGHT_ATK = new Array(64);
export const KING_ATK = new Array(64);
export const PAWN_ATK = [new Array(64), new Array(64)];
export const RAYS = Array.from({ length: 8 }, () => new Array(64).fill(0n));

const DIRS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

function onBoard(f, r) {
  return f >= 0 && f < 8 && r >= 0 && r < 8;
}

for (let s = 0; s < 64; s++) {
  const f = s & 7;
  const r = s >> 3;
  let kn = 0n, ki = 0n, wp = 0n, bp = 0n;
  for (const [df, dr] of KNIGHT_OFF) {
    if (onBoard(f + df, r + dr)) kn |= 1n << BigInt((r + dr) * 8 + (f + df));
  }
  for (const [df, dr] of KING_OFF) {
    if (onBoard(f + df, r + dr)) ki |= 1n << BigInt((r + dr) * 8 + (f + df));
  }
  if (onBoard(f - 1, r + 1)) wp |= 1n << BigInt((r + 1) * 8 + (f - 1));
  if (onBoard(f + 1, r + 1)) wp |= 1n << BigInt((r + 1) * 8 + (f + 1));
  if (onBoard(f - 1, r - 1)) bp |= 1n << BigInt((r - 1) * 8 + (f - 1));
  if (onBoard(f + 1, r - 1)) bp |= 1n << BigInt((r - 1) * 8 + (f + 1));
  KNIGHT_ATK[s] = kn;
  KING_ATK[s] = ki;
  PAWN_ATK[0][s] = wp;
  PAWN_ATK[1][s] = bp;

  for (let d = 0; d < 8; d++) {
    const [df, dr] = DIRS[d];
    let bb = 0n;
    let nf = f + df, nr = r + dr;
    while (onBoard(nf, nr)) {
      bb |= 1n << BigInt(nr * 8 + nf);
      nf += df;
      nr += dr;
    }
    RAYS[d][s] = bb;
  }
}

function slide(sq, occ, d) {
  const ray = RAYS[d][sq];
  const blocked = ray & occ;
  if (!blocked) return ray;
  if (d === 0 || d === 2 || d === 4 || d === 6) {
    const b = blocked & -blocked;
    const blockerSq = b.toString(2).length - 1;
    return ray & ~RAYS[d][blockerSq];
  }
  let x = blocked;
  let msb = 0;
  while (x) {
    msb = x.toString(2).length - 1;
    x &= x - 1n;
  }
  return ray & ~RAYS[d][msb];
}

function edgeMask(sq, bishop) {
  const f = sq & 7, r = sq >> 3;
  let m = 0n;
  const dirs = bishop ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [df, dr] of dirs) {
    let nf = f + df, nr = r + dr;
    while (onBoard(nf + df, nr + dr)) {
      m |= 1n << BigInt(nr * 8 + nf);
      nf += df;
      nr += dr;
    }
  }
  return m;
}

function subsets(mask) {
  const out = [];
  let n = 0n;
  do {
    out.push(n);
    n = (n - mask) & mask;
  } while (n);
  return out;
}

export const BISHOP_MASK = new Array(64);
export const ROOK_MASK = new Array(64);
export const BISHOP_TAB = new Array(64);
export const ROOK_TAB = new Array(64);

function pextIdx(mask, occ) {
  let idx = 0, i = 0;
  let m = mask;
  while (m) {
    const s = lsb(m);
    m ^= 1n << BigInt(s);
    if (occ & (1n << BigInt(s))) idx |= 1 << i;
    i++;
  }
  return idx;
}

for (let s = 0; s < 64; s++) {
  BISHOP_MASK[s] = edgeMask(s, true);
  ROOK_MASK[s] = edgeMask(s, false);
  const bsubs = subsets(BISHOP_MASK[s]);
  BISHOP_TAB[s] = new Array(1 << popcount(BISHOP_MASK[s]));
  for (const occ of bsubs) {
    BISHOP_TAB[s][pextIdx(BISHOP_MASK[s], occ)] =
      slide(s, occ, 4) | slide(s, occ, 5) | slide(s, occ, 6) | slide(s, occ, 7);
  }
  const rsubs = subsets(ROOK_MASK[s]);
  ROOK_TAB[s] = new Array(1 << popcount(ROOK_MASK[s]));
  for (const occ of rsubs) {
    ROOK_TAB[s][pextIdx(ROOK_MASK[s], occ)] =
      slide(s, occ, 0) | slide(s, occ, 1) | slide(s, occ, 2) | slide(s, occ, 3);
  }
}

export function bishopAttacks(sq, occ) {
  return BISHOP_TAB[sq][pextIdx(BISHOP_MASK[sq], occ)];
}

export function rookAttacks(sq, occ) {
  return ROOK_TAB[sq][pextIdx(ROOK_MASK[sq], occ)];
}

export function queenAttacks(sq, occ) {
  return bishopAttacks(sq, occ) | rookAttacks(sq, occ);
}

export function between(a, b) {
  const fa = a & 7, ra = a >> 3, fb = b & 7, rb = b >> 3;
  const df = Math.sign(fb - fa);
  const dr = Math.sign(rb - ra);
  if (df === 0 && dr === 0) return 0n;
  if (df !== 0 && dr !== 0 && Math.abs(fb - fa) !== Math.abs(rb - ra)) return 0n;
  if (df !== 0 && dr === 0 && fa === fb) return 0n;
  let bb = 0n;
  let f = fa + df, r = ra + dr;
  while (f !== fb || r !== rb) {
    bb |= 1n << BigInt(r * 8 + f);
    f += df;
    r += dr;
  }
  return bb;
}
