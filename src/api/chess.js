/**
 * High-level Aurora API for embedding the engine without touching internals.
 */
import { Position, parseUci, moveToUci } from '../engine/position.js';
import { Searcher, scoreToStr } from '../engine/search.js';
import { evaluate } from '../engine/eval.js';
import { START_FEN } from '../engine/const.js';
import { moveToSan } from '../engine/san.js';
import { gameToPgn, parsePgn } from '../engine/pgn.js';
import { validateFen } from '../engine/fen.js';
import { openingName } from '../engine/openings.js';
import { pickSkilled } from '../engine/skill.js';
import { multiPv } from '../engine/multipv.js';
import { probeTb } from '../engine/tb.js';
import { chess960Fen } from '../engine/chess960.js';

export class Aurora {
  constructor() {
    this.pos = new Position();
    this.searcher = new Searcher();
    this.uciHistory = [];
  }
  fen() { return this.pos.fen(); }
  setFen(fen) {
    const v = validateFen(fen);
    if (!v.ok) throw new Error(v.errors.join('; '));
    this.pos.setFen(fen);
    this.uciHistory = [];
    return this;
  }
  newGame(fen = START_FEN) { return this.setFen(fen); }
  chess960(id) { return this.setFen(chess960Fen(id)); }
  legal() { return this.pos.legalMoves().map(moveToUci); }
  play(uci) {
    const m = parseUci(this.pos, uci);
    if (!m) return false;
    this.pos.makeMove(m);
    this.uciHistory.push(uci);
    return true;
  }
  undo() {
    this.pos.undoMove();
    this.uciHistory.pop();
  }
  eval() { return evaluate(this.pos); }
  tb() { return probeTb(this.pos); }
  opening() { return openingName(this.uciHistory); }
  go(opts = {}) {
    return this.searcher.search(this.pos, opts);
  }
  goSkilled(level, opts) {
    return pickSkilled(this.searcher, this.pos, { level, ...opts });
  }
  analyse(k = 3, time = 600) {
    return multiPv(this.pos, { k, time });
  }
  pgn(headers) { return gameToPgn({ moves: this.pos.history.map((h) => h.m), headers }); }
  static parsePgn(p) { return parsePgn(p); }
  static scoreToStr = scoreToStr;
  static moveToSan = moveToSan;
}

export { validateFen, START_FEN };
