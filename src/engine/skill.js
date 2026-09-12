import { Searcher } from './search.js';
import { moveToUci } from './position.js';

/** Map 0–20 (Stockfish-like) to extra root noise and max depth. */
export function skillToLimits(level) {
  const lv = Math.max(0, Math.min(20, level | 0));
  return {
    depth: 2 + Math.floor(lv * 0.7),
    time: 30 + lv * lv * 8,
    noise: (20 - lv) * 18,
  };
}

export function pickSkilled(searcher, pos, { level = 20, time } = {}) {
  const lim = skillToLimits(level);
  const r = searcher.search(pos, { time: time || lim.time, depth: lim.depth, useBook: level >= 8 });
  if (level >= 18 || !r.move) return r;
  const legal = pos.legalMoves();
  if (legal.length <= 1) return r;
  const scored = legal.map((m) => {
    const jitter = (Math.random() - 0.5) * 2 * lim.noise;
    return { m, s: (m === r.move ? r.score : r.score - 80) + jitter };
  });
  scored.sort((a, b) => b.s - a.s);
  const choice = scored[0].m;
  return { ...r, move: choice, skilled: true, uci: moveToUci(choice) };
}

export class SkilledSearcher extends Searcher {
  constructor(level = 20) {
    super();
    this.level = level;
  }
  go(pos, opts = {}) {
    return pickSkilled(this, pos, { level: this.level, ...opts });
  }
}
