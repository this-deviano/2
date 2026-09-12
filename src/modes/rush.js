import { PUZZLES } from '../engine/puzzles.js';
import { WAC } from '../data/wac.js';
import { Position, parseUci } from '../engine/position.js';

export function rushDeck() {
  const a = PUZZLES.filter((p) => p.solution && p.solution.length).map((p) => ({
    fen: p.fen,
    bm: p.solution,
    title: p.title,
  }));
  const b = WAC.map((w) => ({ fen: w.fen, bm: w.bm, title: w.id }));
  return [...a, ...b].sort(() => Math.random() - 0.5);
}

export class PuzzleRush {
  constructor() {
    this.deck = rushDeck();
    this.i = 0;
    this.score = 0;
    this.pos = new Position();
    this.load();
  }
  load() {
    const p = this.deck[this.i];
    if (!p) return null;
    this.pos.setFen(p.fen);
    this.current = p;
    return p;
  }
  attempt(uci) {
    if (!this.current) return { over: true };
    const ok = this.current.bm.includes(uci);
    if (ok) {
      this.score++;
      this.i++;
      const next = this.load();
      return { ok: true, score: this.score, next };
    }
    return { ok: false, score: this.score, bm: this.current.bm };
  }
}
