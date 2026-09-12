import { Position } from './position.js';
import { evaluate } from './eval.js';

/** Logistic error of eval vs result (0/0.5/1). Used for Texel-style tuning. */
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

const QUIET = [
  { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', result: 0.5 },
  { fen: '8/8/8/4k3/8/8/4Q3/4K3 w - - 0 1', result: 1 },
  { fen: '8/8/8/4K3/8/8/4q3/4k3 b - - 0 1', result: 1 },
];

const isMain = process.argv[1] && String(process.argv[1]).includes('texel');
if (isMain) console.log('loss', datasetLoss(QUIET).toFixed(4));
