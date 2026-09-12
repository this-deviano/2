import { OPENING_LINES } from '../engine/openings.js';

export function explore(uciPrefix = []) {
  const n = uciPrefix.length;
  const map = new Map();
  for (const l of OPENING_LINES) {
    if (l.u.length <= n) continue;
    let ok = true;
    for (let i = 0; i < n; i++) if (l.u[i] !== uciPrefix[i]) { ok = false; break; }
    if (!ok) continue;
    const mv = l.u[n];
    if (!map.has(mv)) map.set(mv, []);
    map.get(mv).push(l);
  }
  return [...map.entries()].map(([uci, lines]) => ({
    uci,
    count: lines.length,
    names: [...new Set(lines.map((x) => x.name))].slice(0, 6),
  })).sort((a, b) => b.count - a.count);
}
