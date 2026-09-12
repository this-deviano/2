import { Position, parseUci, moveToUci } from '../engine/position.js';
import { START_FEN } from '../engine/const.js';
import { moveToSan } from '../engine/san.js';
import { gameToPgn } from '../engine/pgn.js';
import { openingName } from '../engine/openings.js';
import { DualClock } from './clock.js';

export class GameSession {
  constructor() {
    this.pos = new Position();
    this.moves = [];
    this.uci = [];
    this.sans = [];
    this.fens = [START_FEN];
    this.clock = new DualClock(180000, 0);
    this.result = '*';
  }
  reset(fen = START_FEN) {
    this.pos.setFen(fen);
    this.moves = [];
    this.uci = [];
    this.sans = [];
    this.fens = [this.pos.fen()];
    this.result = '*';
  }
  playUci(u) {
    const m = parseUci(this.pos, u);
    if (!m) return false;
    const san = moveToSan(this.pos, m);
    this.pos.makeMove(m);
    this.moves.push(m);
    this.uci.push(u);
    this.sans.push(san);
    this.fens.push(this.pos.fen());
    return san;
  }
  undo() {
    if (!this.moves.length) return;
    this.pos.undoMove();
    this.moves.pop();
    this.uci.pop();
    this.sans.pop();
    this.fens.pop();
  }
  gotoPly(n) {
    this.pos.setFen(this.fens[0]);
    this.moves = [];
    this.uci = [];
    this.sans = [];
    const target = this.fens.slice(1, n + 1);
    this.fens = [this.fens[0]];
    // rebuild via stored... simpler: keep snapshot
  }
  opening() {
    return openingName(this.uci);
  }
  pgn(headers = {}) {
    return gameToPgn({ moves: this.moves, headers: { Result: this.result, ...headers } });
  }
}
