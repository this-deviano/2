import { Position } from './position.js';
import { START_FEN } from './const.js';

export function perft(pos, depth) {
  if (depth === 0) return 1;
  const moves = pos.legalMoves();
  if (depth === 1) return moves.length;
  let n = 0;
  for (const m of moves) {
    pos.makeMove(m);
    n += perft(pos, depth - 1);
    pos.undoMove();
  }
  return n;
}

const isMain = process.argv[1] && process.argv[1].includes('perft');
if (isMain) {
  const pos = new Position();
  pos.setFen(START_FEN);
  const d = +(process.argv[2] || 4);
  const t0 = Date.now();
  const n = perft(pos, d);
  console.log(`perft(${d}) = ${n} in ${Date.now() - t0}ms`);
}
