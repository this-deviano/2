import { Position } from '../engine/position.js';
import { parseUci } from '../engine/position.js';
import { START_FEN } from '../engine/const.js';

export class Replay {
  constructor(uci = [], start = START_FEN) {
    this.uci = uci;
    this.start = start;
    this.ply = uci.length;
    this.fens = [start];
    const p = new Position();
    p.setFen(start);
    for (const u of uci) {
      const m = parseUci(p, u);
      if (m) p.makeMove(m);
      this.fens.push(p.fen());
    }
  }
  fen() { return this.fens[this.ply]; }
  back() { if (this.ply > 0) this.ply--; return this.fen(); }
  forward() { if (this.ply < this.uci.length) this.ply++; return this.fen(); }
  to(n) { this.ply = Math.max(0, Math.min(this.uci.length, n)); return this.fen(); }
}
