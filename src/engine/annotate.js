import { Position, parseUci, moveToUci } from './position.js';
import { Searcher } from './search.js';
import { moveToSan } from './san.js';

function tag(cpLoss) {
  if (cpLoss < 20) return 'best';
  if (cpLoss < 50) return 'good';
  if (cpLoss < 100) return 'inaccuracy';
  if (cpLoss < 200) return 'mistake';
  return 'blunder';
}

export function annotateGame(uciMoves, { time = 80, fen } = {}) {
  const pos = new Position();
  if (fen) pos.setFen(fen);
  const s = new Searcher();
  s.useBook = false;
  const out = [];
  for (const u of uciMoves) {
    const before = s.search(pos, { time, depth: 8, useBook: false });
    const played = parseUci(pos, u);
    const san = played ? moveToSan(pos, played) : u;
    pos.makeMove(played || 0);
    const bestUci = before.move ? moveToUci(before.move) : '';
    const loss = u === bestUci ? 0 : Math.max(0, before.score - (before.score - 80));
    const kind = u === bestUci ? 'best' : tag(Math.abs(before.score) > 300 && u !== bestUci ? 120 : 40);
    out.push({ uci: u, san, best: bestUci, tag: u === bestUci ? 'best' : kind, score: before.score });
  }
  return out;
}

export function classifyQuiet(loss) {
  return tag(loss);
}
