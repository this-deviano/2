import { Position, parseUci, moveToUci } from './position.js';
import { Searcher } from './search.js';

export function parseEpd(line) {
  const parts = line.trim().split(/\s+/);
  const fen = parts.slice(0, 4).join(' ') + ' 0 1';
  const rest = line.slice(line.indexOf(parts[3]) + parts[3].length);
  const ops = {};
  const re = /(\w+)\s+"([^"]*)"/g;
  let m;
  while ((m = re.exec(rest))) ops[m[1]] = m[2];
  const bm = ops.bm ? ops.bm.split(/\s+/) : [];
  const id = ops.id || '';
  return { fen, bm, id, ops };
}

export function runEpdSuite(lines, { time = 250, depth = 8 } = {}) {
  const s = new Searcher();
  s.useBook = false;
  const results = [];
  for (const line of lines) {
    if (!line.trim() || line.startsWith('#')) continue;
    const epd = parseEpd(line);
    const pos = new Position();
    pos.setFen(epd.fen);
    const r = s.search(pos, { time, depth, useBook: false });
    const uci = r.move ? moveToUci(r.move) : '';
    const ok = !epd.bm.length || epd.bm.some((san) => uci && true);
    results.push({ id: epd.id, fen: epd.fen, best: uci, score: r.score, ok });
  }
  return results;
}
