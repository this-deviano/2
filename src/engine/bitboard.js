/**
 * Bitboard primitives.
 *
 * Boards are BigInt because JS `number` only has 53 exact integer bits, but every
 * hot path below avoids BigInt arithmetic where it can: bit scans and popcounts
 * split the board into two 32-bit numbers and work on those, and `bit()` reads a
 * precomputed table instead of allocating `1n << BigInt(sq)` on every call.
 *
 * These functions are the innermost loop of move generation, so anything that
 * allocates or converts to a string here is directly measurable in nps.
 */

const MASK32 = 0xffffffffn;

export const ONE = 1n;

/** Precomputed `1n << sq`. Use this instead of shifting a fresh BigInt. */
export const BITS = new Array(64);
for (let i = 0; i < 64; i++) BITS[i] = 1n << BigInt(i);

export function bit(sq) {
  return BITS[sq];
}

/** Low 32 bits of a bitboard as a Number. */
function lo32(bb) {
  return Number(bb & MASK32);
}

/** High 32 bits of a bitboard as a Number. */
function hi32(bb) {
  return Number((bb >> 32n) & MASK32);
}

/** Index of the lowest set bit, or -1 for an empty board. */
export function lsb(bb) {
  if (bb === 0n) return -1;
  const lo = lo32(bb);
  if (lo !== 0) return 31 - Math.clz32(lo & -lo);
  const hi = hi32(bb);
  return 32 + 31 - Math.clz32(hi & -hi);
}

/** Clear and return the lowest set bit of `state.bb` in place. */
export function popLsb(state) {
  const bb = state.bb;
  if (bb === 0n) return -1;
  const sq = lsb(bb);
  state.bb = bb & (bb - 1n);
  return sq;
}

/** SWAR popcount over a 32-bit word. */
function pop32(x) {
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  x = (x + (x >>> 4)) & 0x0f0f0f0f;
  return Math.imul(x, 0x01010101) >>> 24;
}

export function popcount(bb) {
  return pop32(lo32(bb)) + pop32(hi32(bb));
}

/** True when more than one bit is set. */
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
    if (onBoard(f + df, r + dr)) kn |= BITS[(r + dr) * 8 + (f + df)];
  }
  for (const [df, dr] of KING_OFF) {
    if (onBoard(f + df, r + dr)) ki |= BITS[(r + dr) * 8 + (f + df)];
  }
  if (onBoard(f - 1, r + 1)) wp |= BITS[(r + 1) * 8 + (f - 1)];
  if (onBoard(f + 1, r + 1)) wp |= BITS[(r + 1) * 8 + (f + 1)];
  if (onBoard(f - 1, r - 1)) bp |= BITS[(r - 1) * 8 + (f - 1)];
  if (onBoard(f + 1, r - 1)) bp |= BITS[(r - 1) * 8 + (f + 1)];
  KNIGHT_ATK[s] = kn;
  KING_ATK[s] = ki;
  PAWN_ATK[0][s] = wp;
  PAWN_ATK[1][s] = bp;

  for (let d = 0; d < 8; d++) {
    const [df, dr] = DIRS[d];
    let bb = 0n;
    let nf = f + df, nr = r + dr;
    while (onBoard(nf, nr)) {
      bb |= BITS[nr * 8 + nf];
      nf += df;
      nr += dr;
    }
    RAYS[d][s] = bb;
  }
}

/** Index of the highest set bit, or -1 for an empty board. */
export function msb(bb) {
  if (bb === 0n) return -1;
  const hi = hi32(bb);
  if (hi !== 0) return 32 + 31 - Math.clz32(hi);
  return 31 - Math.clz32(lo32(bb));
}

function slide(sq, occ, d) {
  const ray = RAYS[d][sq];
  const blocked = ray & occ;
  if (blocked === 0n) return ray;
  if (d === 0 || d === 2 || d === 4 || d === 6) {
    return ray & ~RAYS[d][lsb(blocked)];
  }
  return ray & ~RAYS[d][msb(blocked)];
}

function edgeMask(sq, bishop) {
  const f = sq & 7, r = sq >> 3;
  let m = 0n;
  const dirs = bishop ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [df, dr] of dirs) {
    let nf = f + df, nr = r + dr;
    while (onBoard(nf + df, nr + dr)) {
      m |= BITS[nr * 8 + nf];
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
/** Bit indices inside each magic mask, in the order `pextIdx` packs them. */
export const BISHOP_IDX = new Array(64);
export const ROOK_IDX = new Array(64);

function maskIndices(mask) {
  const out = [];
  let m = mask;
  while (m !== 0n) {
    out.push(lsb(m));
    m &= m - 1n;
  }
  return out;
}

/**
 * PEXT-style index: pack the occupancy bits that fall inside `idxs` into a
 * small integer. `lo`/`hi` are the board's 32-bit halves, passed in so callers
 * that look up two directions at once (queen) split the BigInt only once.
 */
export function pextIdx(idxs, lo, hi) {
  let idx = 0;
  for (let i = 0; i < idxs.length; i++) {
    const s = idxs[i];
    const b = s < 32 ? (lo >>> s) & 1 : (hi >>> (s - 32)) & 1;
    idx |= b << i;
  }
  return idx;
}

for (let s = 0; s < 64; s++) {
  BISHOP_MASK[s] = edgeMask(s, true);
  ROOK_MASK[s] = edgeMask(s, false);
  BISHOP_IDX[s] = maskIndices(BISHOP_MASK[s]);
  ROOK_IDX[s] = maskIndices(ROOK_MASK[s]);

  const bsubs = subsets(BISHOP_MASK[s]);
  BISHOP_TAB[s] = new Array(1 << popcount(BISHOP_MASK[s]));
  for (const occ of bsubs) {
    const lo = lo32(occ), hi = hi32(occ);
    BISHOP_TAB[s][pextIdx(BISHOP_IDX[s], lo, hi)] =
      slide(s, occ, 4) | slide(s, occ, 5) | slide(s, occ, 6) | slide(s, occ, 7);
  }
  const rsubs = subsets(ROOK_MASK[s]);
  ROOK_TAB[s] = new Array(1 << popcount(ROOK_MASK[s]));
  for (const occ of rsubs) {
    const lo = lo32(occ), hi = hi32(occ);
    ROOK_TAB[s][pextIdx(ROOK_IDX[s], lo, hi)] =
      slide(s, occ, 0) | slide(s, occ, 1) | slide(s, occ, 2) | slide(s, occ, 3);
  }
}

export function bishopAttacks(sq, occ) {
  const lo = lo32(occ), hi = hi32(occ);
  return BISHOP_TAB[sq][pextIdx(BISHOP_IDX[sq], lo, hi)];
}

export function rookAttacks(sq, occ) {
  const lo = lo32(occ), hi = hi32(occ);
  return ROOK_TAB[sq][pextIdx(ROOK_IDX[sq], lo, hi)];
}

/** Bishop | rook, splitting the occupancy BigInt once instead of twice. */
export function queenAttacks(sq, occ) {
  const lo = lo32(occ), hi = hi32(occ);
  return BISHOP_TAB[sq][pextIdx(BISHOP_IDX[sq], lo, hi)]
    | ROOK_TAB[sq][pextIdx(ROOK_IDX[sq], lo, hi)];
}

/** Precomputed squares strictly between a and b (0n when they are not aligned). */
export const BETWEEN = Array.from({ length: 64 }, () => new Array(64).fill(0n));

for (let a = 0; a < 64; a++) {
  for (let b = 0; b < 64; b++) {
    const fa = a & 7, ra = a >> 3, fb = b & 7, rb = b >> 3;
    const df = Math.sign(fb - fa);
    const dr = Math.sign(rb - ra);
    if (df === 0 && dr === 0) continue;
    const diagonal = df !== 0 && dr !== 0 && Math.abs(fb - fa) === Math.abs(rb - ra);
    const straight = (df === 0) !== (dr === 0);
    if (!diagonal && !straight) continue;
    let bb = 0n;
    let f = fa + df, r = ra + dr;
    while (f !== fb || r !== rb) {
      bb |= BITS[r * 8 + f];
      f += df;
      r += dr;
    }
    BETWEEN[a][b] = bb;
  }
}

/** Squares strictly between a and b along their line, or 0n if not aligned. */
export function between(a, b) {
  return BETWEEN[a][b];
}
