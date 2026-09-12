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
/** Output bias. `let` because trainNNUE() updates it in place. */
export let B2 = 12;

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

/**
 * Reused accumulator. nnueEval is synchronous and never reentrant, so a shared
 * scratch buffer is safe and keeps this — called once per leaf node — free of
 * per-call allocation.
 */
const ACC = new Float32Array(H);

export function nnueEval(pos) {
  const acc = ACC;
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

/* ------------------------------------------------------------------ *
 * Training
 * ------------------------------------------------------------------ */

/**
 * Collect the active input features of a position: one index per piece on the
 * board, in the same `(color * 6 + piece) * 64 + square` layout as W1.
 */
export function features(pos) {
  const out = [];
  for (let c = 0; c < 2; c++) {
    for (let p = 0; p < 6; p++) {
      let bb = pos.bb[c][p];
      const feat = (c * 6 + p) * 64;
      while (bb) {
        const sq = lsb(bb);
        bb ^= bit(sq);
        out.push(feat + sq);
      }
    }
  }
  return out;
}

/** crelu derivative: 1 strictly inside (0,1), 0 elsewhere. */
function dcrelu(x) {
  return x > 0 && x < 1 ? 1 : 0;
}

/**
 * Texel-style supervised training of the net.
 *
 * Regresses the network's centipawn output onto game results mapped to
 * +/-`target`, by plain gradient descent. The output layer (W2/B2) always
 * trains; `trainHidden` also updates W1/B1. Returns the loss before and after so
 * callers can show the improvement.
 *
 * @param {{fen:string,result:number}[]} rows result 1 = side to move wins
 */
export function trainNNUE(rows, { epochs = 40, lr = 0.004, target = 300, trainHidden = false } = {}) {
  if (!rows.length) return { before: 0, after: 0, epochs: 0 };

  // Precompute features and targets once; the position scan is the expensive part.
  const samples = rows.map((r) => ({
    f: r.features,
    t: (r.result * 2 - 1) * target,
    sign: r.side === 1 ? -1 : 1,
  }));
  if (samples.some((s) => !s.f)) {
    throw new Error('trainNNUE rows need a `features` array (see features())');
  }

  const lossAt = () => {
    let e = 0;
    const acc = new Float32Array(H);
    for (const s of samples) {
      acc.set(B1);
      for (const f of s.f) for (let h = 0; h < H; h++) acc[h] += W1[f * H + h];
      let y = B2;
      for (let h = 0; h < H; h++) y += W2[h] * crelu(acc[h]);
      const pred = s.sign * y;
      const d = pred - s.t;
      e += d * d;
    }
    return e / samples.length;
  };

  const before = lossAt();
  const gW2 = new Float32Array(H);
  const gB1 = new Float32Array(H);
  const gW1 = new Float32Array(H);
  const acc = new Float32Array(H);

  for (let ep = 0; ep < epochs; ep++) {
    gW2.fill(0);
    let gB2 = 0;
    if (trainHidden) { gB1.fill(0); }

    for (const s of samples) {
      acc.set(B1);
      for (const f of s.f) for (let h = 0; h < H; h++) acc[h] += W1[f * H + h];

      let y = B2;
      for (let h = 0; h < H; h++) y += W2[h] * crelu(acc[h]);

      const pred = s.sign * y;
      // d(loss)/d(y), averaged over the sample count
      const dy = (2 * (pred - s.t) * s.sign) / samples.length;

      gB2 += dy;
      for (let h = 0; h < H; h++) gW2[h] += dy * crelu(acc[h]);

      if (trainHidden) {
        gW1.fill(0);
        for (let h = 0; h < H; h++) {
          const gAcc = dy * W2[h] * dcrelu(acc[h]);
          gB1[h] += gAcc;
          gW1[h] = gAcc;
        }
        for (const f of s.f) {
          const off = f * H;
          for (let h = 0; h < H; h++) W1[off + h] -= lr * gW1[h];
        }
      }
    }

    B2 -= lr * gB2;
    for (let h = 0; h < H; h++) W2[h] -= lr * gW2[h];
    if (trainHidden) for (let h = 0; h < H; h++) B1[h] -= lr * gB1[h];
  }

  return { before, after: lossAt(), epochs };
}
