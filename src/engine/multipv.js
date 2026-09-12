import { Searcher } from './search.js';
import { moveToUci } from './position.js';

export function multiPv(pos, { k = 3, time = 400, depth = 8 } = {}) {
  const s = new Searcher();
  s.useBook = false;
  const lines = [];
  const excluded = [];
  const legal = pos.legalMoves();
  const n = Math.min(k, legal.length);
  for (let i = 0; i < n; i++) {
    const orig = pos.legalMoves;
    pos.legalMoves = function () {
      return orig.call(this).filter((m) => !excluded.includes(m));
    };
    const r = s.search(pos, { time: time / n, depth, useBook: false });
    pos.legalMoves = orig;
    if (!r.move) break;
    lines.push({
      multipv: i + 1,
      uci: moveToUci(r.move),
      score: r.score,
      pv: r.pv,
      nodes: r.nodes,
    });
    excluded.push(r.move);
  }
  return lines;
}
