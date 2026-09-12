import { moveFrom, moveTo, movePromo, moveFlags, MF_CAPTURE } from './position.js';
import { PIECE_VAL } from './const.js';
import { see } from './see.js';

export class MovePicker {
  constructor(pos, { ttMove = 0, killers = [0, 0], history, counter = 0 } = {}) {
    this.pos = pos;
    this.ttMove = ttMove;
    this.killers = killers;
    this.history = history;
    this.counter = counter;
    this.stage = 0;
    this.moves = [];
    this.i = 0;
  }

  score(m) {
    if (m === this.ttMove) return 4e9;
    if (moveFlags(m) & MF_CAPTURE) {
      const v = this.pos.pieceOn(moveTo(m));
      const a = this.pos.pieceOn(moveFrom(m));
      return 1e8 + (v ? PIECE_VAL[v.type] : 0) * 16 - (a ? PIECE_VAL[a.type] : 0) + see(this.pos, m);
    }
    if (movePromo(m) === 4) return 9e7;
    if (m === this.killers[0]) return 8e7;
    if (m === this.killers[1]) return 7e7;
    if (m === this.counter) return 6e7;
    return this.history ? this.history[moveFrom(m) * 64 + moveTo(m)] : 0;
  }

  pickAll(legal) {
    const scored = legal.map((m) => ({ m, s: this.score(m) }));
    scored.sort((a, b) => b.s - a.s);
    return scored.map((x) => x.m);
  }
}
