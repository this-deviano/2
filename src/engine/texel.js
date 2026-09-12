import { Position } from './position.js';
import { evaluate } from './eval.js';
import { features, trainNNUE } from './nnue.js';

/**
 * Texel-style tuning.
 *
 * Two halves, deliberately separate:
 *
 *   qError / datasetLoss — measure how well the *current* evaluation predicts
 *   game outcomes, as logistic error. Pure measurement, no side effects.
 *
 *   tune() — actually improves the net by gradient descent on the labelled set,
 *   via trainNNUE(). Returns before/after loss so the improvement is visible.
 */

/** Logistic error of eval vs result (0/0.5/1). */
export function qError(fen, result, k = 1.2) {
  const pos = new Position();
  pos.setFen(fen);
  const s = evaluate(pos);
  const p = 1 / (1 + Math.exp(-k * s / 100));
  return (p - result) ** 2;
}

export function datasetLoss(rows, k = 1.2) {
  let e = 0;
  for (const r of rows) e += qError(r.fen, r.result, k);
  return e / rows.length;
}

/**
 * Labelled positions for tuning. `result` is from White's point of view:
 * 1 = White wins, 0.5 = draw, 0 = Black wins.
 */
export const DATASET = [
  { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', result: 0.5 },
  { fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', result: 0.5 },
  { fen: '8/8/8/4k3/8/8/4Q3/4K3 w - - 0 1', result: 1 },
  { fen: '8/8/8/4K3/8/8/4q3/4k3 b - - 0 1', result: 0 },
  { fen: '8/8/8/8/8/8/6k1/R5K1 w - - 0 1', result: 1 },
  { fen: '8/8/8/8/8/8/6K1/r5k1 b - - 0 1', result: 0 },
  { fen: '8/2k5/8/8/8/8/5K2/R7 w - - 0 1', result: 0.5 },
  { fen: '8/8/8/8/8/8/4k3/4K2R w - - 0 1', result: 1 },
  { fen: '4k3/8/8/8/8/8/8/R3K3 w - - 0 1', result: 0.5 },
  { fen: '8/8/8/8/8/8/P7/K6k w - - 0 1', result: 1 },
  { fen: '8/8/8/8/8/7k/6p1/6K1 b - - 0 1', result: 0 },
  { fen: '8/8/8/8/8/8/8/K6k w - - 0 1', result: 0.5 },
  { fen: 'r5k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1', result: 1 },
  { fen: 'r5k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', result: 0.5 },
  { fen: '6k1/5ppp/8/8/8/8/5PPP/4Q1K1 w - - 0 1', result: 1 },
  { fen: '7k/8/8/8/8/8/R7/1R4K1 w - - 0 1', result: 1 },
];

/** Attach the network input features each labelled position needs. */
export function toSamples(rows = DATASET) {
  return rows.map((r) => {
    const pos = new Position();
    pos.setFen(r.fen);
    // Net output is side-relative; flip White-oriented results when Black moves.
    const result = pos.side === 1 ? 1 - r.result : r.result;
    return { features: features(pos), result, side: pos.side, fen: r.fen };
  });
}

/**
 * Run gradient descent on the labelled set and report the improvement.
 * Does not touch the on-disk weights of the running process beyond the in-memory
 * net — callers that want to persist should serialise W1/B1/W2/B2 themselves.
 */
export function tune(rows = DATASET, opts = {}) {
  const before = datasetLoss(rows);
  const net = trainNNUE(toSamples(rows), { epochs: 60, lr: 0.02, ...opts });
  const after = datasetLoss(rows);
  return { logisticBefore: before, logisticAfter: after, ...net };
}

const isMain = process.argv[1] && String(process.argv[1]).includes('texel');
if (isMain) {
  const r = tune();
  console.log(`net regression loss ${r.before.toFixed(1)} -> ${r.after.toFixed(1)} over ${r.epochs} epochs`);
  console.log(`total-eval logistic loss ${r.logisticBefore.toFixed(4)} -> ${r.logisticAfter.toFixed(4)}`);
  console.log('(the net is 1/6 of evaluate(), so total-eval loss moves far less than net loss)');
}
