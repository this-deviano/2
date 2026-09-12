import { Searcher } from './search.js';
import { parseUci, moveToUci } from './position.js';

export function ponderMove(pos, predictedUci, { time = 2000 } = {}) {
  const m = parseUci(pos, predictedUci);
  if (!m) return null;
  pos.makeMove(m);
  const s = new Searcher();
  s.useBook = false;
  const r = s.search(pos, { time, useBook: false });
  pos.undoMove();
  return r.move ? { ponder: predictedUci, reply: moveToUci(r.move), score: r.score } : null;
}
