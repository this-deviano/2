import { Position, moveToUci } from './position.js';
import { perft } from './perft.js';

export function divide(pos, depth) {
  const rows = [];
  let total = 0;
  for (const m of pos.legalMoves()) {
    pos.makeMove(m);
    const n = perft(pos, depth - 1);
    pos.undoMove();
    rows.push({ uci: moveToUci(m), nodes: n });
    total += n;
  }
  rows.sort((a, b) => a.uci.localeCompare(b.uci));
  return { rows, total };
}

const isMain = process.argv[1] && String(process.argv[1]).includes('divide');
if (isMain) {
  const pos = new Position();
  const d = +(process.argv[2] || 2);
  const { rows, total } = divide(pos, d);
  for (const r of rows) console.log(r.uci, r.nodes);
  console.log('total', total);
}
