import { OPENING_LINES, probeOpening } from '../engine/openings.js';
import { Position, parseUci, moveToUci } from '../engine/position.js';
import { START_FEN } from '../engine/const.js';
import { moveToSan } from '../engine/san.js';

export function randomLine(rng = Math.random) {
  return OPENING_LINES[(rng() * OPENING_LINES.length) | 0];
}

export class OpeningTrainer {
  constructor(line) {
    this.line = line || randomLine();
    this.pos = new Position();
    this.ply = 0;
  }
  expected() {
    return this.line.u[this.ply] || null;
  }
  tryMove(uci) {
    const exp = this.expected();
    if (!exp) return { done: true };
    const ok = uci === exp;
    if (ok) {
      const m = parseUci(this.pos, uci);
      const san = moveToSan(this.pos, m);
      this.pos.makeMove(m);
      this.ply++;
      let reply = null;
      if (this.expected()) {
        const r = parseUci(this.pos, this.expected());
        reply = { uci: this.expected(), san: moveToSan(this.pos, r) };
        this.pos.makeMove(r);
        this.ply++;
      }
      return { ok: true, san, reply, done: !this.expected() };
    }
    return { ok: false, expected: exp };
  }
  hint() {
    return this.expected();
  }
}
