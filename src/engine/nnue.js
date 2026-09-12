/**
 * Compact linear "NNUE": 12×64 piece-square features → 32 hidden (clipped ReLU) → 1.
 * Weights are seeded from PST + small structured noise so the net is deterministic
 * and stronger than raw material without a multi-GB training dump.
 */
import { lsb, bit } from './bitboard.js';
import { PIECE_VAL } from './const.js';

const H = 32;
const IN = 12 * 64;

function mulberry(seed) {
  let s = seed >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry(0xA40AA);
export const W1 = new Float32Array(IN * H);
export const B1 = new Float32Array(H);
export const W2 = new Float32Array(H);
export const B2 = 12;

(function init() {
  const pst = [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ];
  for (let f = 0; f < IN; f++) {
    const pt = (f / 64) | 0;
    const sq = f % 64;
    const color = pt < 6 ? 1 : -1;
    const type = pt % 6;
    const base = color * (PIECE_VAL[type] / 32);
    const p = type === 0 ? pst[color === 1 ? sq ^ 56 : sq] / 40 : 0;
    for (let h = 0; h < H; h++) {
      W1[f * H + h] = base / H + p / H + (rnd() - 0.5) * 0.04;
    }
  }
  for (let h = 0; h < H; h++) {
    B1[h] = (rnd() - 0.5) * 0.1;
    W2[h] = 0.8 + (rnd() - 0.5) * 0.2;
  }
})();

function crelu(x) {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

export function nnueEval(pos) {
  const acc = new Float32Array(H);
  acc.set(B1);
  for (let c = 0; c < 2; c++) {
    for (let p = 0; p < 6; p++) {
      let bb = pos.bb[c][p];
      const feat = (c * 6 + p) * 64;
      while (bb) {
        const sq = lsb(bb);
        bb ^= bit(sq);
        const off = (feat + sq) * H;
        for (let h = 0; h < H; h++) acc[h] += W1[off + h];
      }
    }
  }
  let y = B2;
  for (let h = 0; h < H; h++) y += W2[h] * crelu(acc[h]);
  const s = y | 0;
  return pos.side === 0 ? s : -s;
}
