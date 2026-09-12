import { INF, MATE, MATE_IN_MAX, PIECE_VAL, PAWN } from './const.js';
import { evaluate } from './eval.js';
import { moveFrom, moveTo, movePromo, moveFlags, MF_CAPTURE, MF_EP, moveToUci, parseUci } from './position.js';
import { see } from './see.js';
import { probeBook } from './book.js';
import { probeOpening } from './openings.js';
import { isDrawnEndgame } from './endgame.js';
import { MovePicker } from './movepick.js';
import { SP } from './search-params.js';

const TT_EXACT = 0;
const TT_LOWER = 1;
const TT_UPPER = 2;

export class Searcher {
  constructor() {
    this.tt = new Map();
    this.ttMax = 1 << 20;
    this.nodes = 0;
    this.start = 0;
    this.timeLimit = 1000;
    this.stop = false;
    this.killers = Array.from({ length: 64 }, () => [0, 0]);
    this.history = new Int32Array(64 * 64);
    this.counter = new Int32Array(64 * 64);
    this.bestMove = 0;
    this.bestScore = 0;
    this.pv = [];
    this.maxDepth = 64;
    this.onInfo = null;
    this.useBook = true;
    this.contempt = 0;
    this.pvLine = [];
  }

  clear() {
    this.tt.clear();
    this.killers = Array.from({ length: 64 }, () => [0, 0]);
    this.history.fill(0);
  }

  timedOut() {
    return this.stop || (performance.now() - this.start > this.timeLimit);
  }

  ttGet(hash) {
    return this.tt.get(hash);
  }

  ttPut(hash, depth, score, flag, move) {
    if (this.tt.size > this.ttMax) {
      this.tt.clear();
    }
    this.tt.set(hash, { depth, score, flag, move });
  }

  mvvLva(pos, m) {
    const to = moveTo(m);
    const from = moveFrom(m);
    const victim = pos.pieceOn(to);
    const attacker = pos.pieceOn(from);
    const v = victim ? PIECE_VAL[victim.type] : 0;
    const a = attacker ? PIECE_VAL[attacker.type] : 0;
    return v * 16 - a;
  }

  scoreMove(pos, m, ply, ttMove) {
    if (m === ttMove) return 1e9;
    if (moveFlags(m) & MF_CAPTURE) return 100000 + this.mvvLva(pos, m);
    if (movePromo(m) === 4) return 90000;
    if (this.killers[ply] && this.killers[ply][0] === m) return 80000;
    if (this.killers[ply] && this.killers[ply][1] === m) return 70000;
    return this.history[moveFrom(m) * 64 + moveTo(m)];
  }

  order(pos, moves, ply, ttMove) {
    const scored = moves.map((m) => ({ m, s: this.scoreMove(pos, m, ply, ttMove) }));
    scored.sort((a, b) => b.s - a.s);
    return scored.map((x) => x.m);
  }

  quiesce(pos, alpha, beta, ply) {
    this.nodes++;
    if (this.timedOut()) return alpha;
    if (ply > 48) return evaluate(pos);

    const stand = evaluate(pos);
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;

    let moves = pos.genMoves(true);
    moves = this.order(pos, pos.filterLegal(moves), ply, 0);

    for (const m of moves) {
      const flags = moveFlags(m);
      const promo = movePromo(m);
      if (!(flags & MF_CAPTURE) && !promo) continue;
      // Delta pruning: even with the victim's full value added, this capture
      // cannot lift the stand-pat score up to alpha, so skip it. Promotions are
      // exempt — their gain is not bounded by the captured piece.
      if (!promo) {
        const victim = (flags & MF_EP) ? PIECE_VAL[PAWN] : (PIECE_VAL[pos.pieceTypeOn(moveTo(m))] ?? 0);
        if (stand + victim + SP.DELTA_PRUNE < alpha) continue;
      }
      if (see(pos, m) < SP.SEE_QS) continue;
      pos.makeMove(m);
      const score = -this.quiesce(pos, -beta, -alpha, ply + 1);
      pos.undoMove();
      if (this.timedOut()) return alpha;
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  alphabeta(pos, depth, alpha, beta, ply, pvNode) {
    this.nodes++;
    if (this.timedOut()) return 0;

    if (pos.halfmove >= 100 || pos.isRepetition() || pos.insufficientMaterial() || isDrawnEndgame(pos)) return 0;

    const inCheck = pos.inCheck();
    if (inCheck) depth++;

    const alphaOrig = alpha;
    const tt = this.ttGet(pos.hash);
    let ttMove = 0;
    if (tt && tt.depth >= depth && !pvNode) {
      ttMove = tt.move;
      let s = tt.score;
      if (s > MATE_IN_MAX) s -= ply;
      if (s < -MATE_IN_MAX) s += ply;
      if (tt.flag === TT_EXACT) return s;
      if (tt.flag === TT_LOWER && s >= beta) return s;
      if (tt.flag === TT_UPPER && s <= alpha) return s;
    } else if (tt) ttMove = tt.move;

    if (depth <= 0) return this.quiesce(pos, alpha, beta, ply);

    // Contempt: skew the static eval so the engine steers away of draws it could
    // otherwise accept. 0 (the default) leaves evaluation untouched.
    const eval0 = !inCheck ? evaluate(pos) + SP.CONTEMPT : 0;
    if (!pvNode && !inCheck && depth <= SP.FUTILITY_DEPTH && eval0 - SP.RFP_MARGIN * depth >= beta) return eval0;
    if (!pvNode && !inCheck && depth <= 2 && eval0 + SP.RAZOR_MARGIN * depth <= alpha) {
      return this.quiesce(pos, alpha, beta, ply);
    }

    if (!pvNode && !inCheck && depth >= SP.NMP_MIN_DEPTH) {
      if (eval0 >= beta) {
        pos.side ^= 1;
        pos.hash ^= 0x9e3779b97f4a7c15n;
        const R = SP.NMP_R + (depth > 6 ? 1 : 0);
        const score = -this.alphabeta(pos, depth - 1 - R, -beta, -beta + 1, ply + 1, false);
        pos.side ^= 1;
        pos.hash ^= 0x9e3779b97f4a7c15n;
        if (this.timedOut()) return 0;
        if (score >= beta) return beta;
      }
    }

    let moves = pos.legalMoves();
    if (!moves.length) {
      return inCheck ? -MATE + ply : 0;
    }

    const prev = pos.history.length ? pos.history[pos.history.length - 1].m : 0;
    const cm = prev ? this.counter[moveFrom(prev) * 64 + moveTo(prev)] : 0;
    const picker = new MovePicker(pos, { ttMove, killers: this.killers[ply] || [0, 0], history: this.history, counter: cm });
    moves = picker.pickAll(moves);

    let best = -INF;
    let bestMove = moves[0];
    let legal = 0;

    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      legal++;
      const capture = moveFlags(m) & MF_CAPTURE;
      pos.makeMove(m);

      let score;
      const givesCheck = pos.inCheck();
      let newDepth = depth - 1;
      if (depth >= SP.LMR_MIN_DEPTH && i >= SP.LMR_MIN_MOVE && !capture && !givesCheck && !movePromo(m) && !inCheck) {
        const red = 1 + (i > SP.LMR_LATE ? 1 : 0);
        score = -this.alphabeta(pos, newDepth - red, -alpha - 1, -alpha, ply + 1, false);
        if (score > alpha) score = -this.alphabeta(pos, newDepth, -beta, -alpha, ply + 1, pvNode && i === 0);
      } else if (!pvNode || i > 0) {
        score = -this.alphabeta(pos, newDepth, -alpha - 1, -alpha, ply + 1, false);
        if (score > alpha && score < beta) {
          score = -this.alphabeta(pos, newDepth, -beta, -alpha, ply + 1, true);
        }
      } else {
        score = -this.alphabeta(pos, newDepth, -beta, -alpha, ply + 1, true);
      }

      pos.undoMove();
      if (this.timedOut()) return 0;

      if (score > best) {
        best = score;
        bestMove = m;
        if (score > alpha) {
          alpha = score;
          if (ply === 0) {
            this.bestMove = m;
            this.bestScore = score;
          }
        }
      }
      if (alpha >= beta) {
        if (!capture) {
          this.killers[ply][1] = this.killers[ply][0];
          this.killers[ply][0] = m;
          this.history[moveFrom(m) * 64 + moveTo(m)] += SP.HISTORY_BONUS * depth * depth;
          if (prev) this.counter[moveFrom(prev) * 64 + moveTo(prev)] = m;
        }
        break;
      }
    }

    let flag = TT_EXACT;
    if (best <= alphaOrig) flag = TT_UPPER;
    else if (best >= beta) flag = TT_LOWER;
    let store = best;
    if (store > MATE_IN_MAX) store += ply;
    if (store < -MATE_IN_MAX) store -= ply;
    this.ttPut(pos.hash, depth, store, flag, bestMove);
    return best;
  }

  extractPv(pos, max = 16) {
    const line = [];
    const seen = new Set();
    for (let i = 0; i < max; i++) {
      const tt = this.ttGet(pos.hash);
      if (!tt || !tt.move) break;
      if (seen.has(pos.hash)) break;
      seen.add(pos.hash);
      const legal = pos.legalMoves();
      if (!legal.includes(tt.move)) break;
      line.push(moveToUci(tt.move));
      pos.makeMove(tt.move);
    }
    for (let i = 0; i < line.length; i++) pos.undoMove();
    return line;
  }

  search(pos, { time = 1000, depth = 64, infinite = false, useBook = this.useBook } = {}) {
    this.nodes = 0;
    this.start = performance.now();
    this.timeLimit = infinite ? 1e12 : time;
    this.stop = false;
    this.maxDepth = depth;
    this.bestMove = pos.legalMoves()[0] || 0;
    this.bestScore = 0;

    if (useBook && pos.fullmove <= 16) {
      const hist = pos.history.map((h) => moveToUci(h.m));
      const fromLines = probeOpening(hist);
      const fromFen = probeBook(pos.fen());
      const b = fromLines || fromFen;
      if (b) {
        const m = parseUci(pos, b);
        if (m) {
          this.bestMove = m;
          if (this.onInfo) this.onInfo({ depth: 0, score: 0, nodes: 0, nps: 0, time: 0, pv: b, book: true });
          return { move: m, score: 0, nodes: 0, book: true, pv: [b] };
        }
      }
    }

    let lastScore = 0;
    let alpha = -INF;
    let beta = INF;
    for (let d = 1; d <= this.maxDepth; d++) {
      let score = this.alphabeta(pos, d, alpha, beta, 0, true);
      if (this.timedOut() && d > 1) break;
      if (score <= alpha || score >= beta) {
        score = this.alphabeta(pos, d, -INF, INF, 0, true);
        if (this.timedOut() && d > 1) break;
      }
      lastScore = score;
      this.bestScore = score;
      alpha = score - SP.ASPIRATION;
      beta = score + SP.ASPIRATION;
      const elapsed = performance.now() - this.start;
      const nps = elapsed > 0 ? (this.nodes * 1000 / elapsed) | 0 : 0;
      const pv = this.extractPv(pos);
      this.pvLine = pv;
      const info = {
        depth: d,
        score,
        nodes: this.nodes,
        nps,
        time: elapsed | 0,
        pv: pv.join(' ') || (this.bestMove ? moveToUci(this.bestMove) : ''),
      };
      if (this.onInfo) this.onInfo(info);
      if (!infinite && elapsed > this.timeLimit * 0.6) break;
      if (Math.abs(score) > MATE_IN_MAX) break;
    }
    return { move: this.bestMove, score: lastScore, nodes: this.nodes, pv: this.pvLine };
  }
}

export function scoreToStr(s) {
  if (s > MATE_IN_MAX) return `mate ${((MATE - s + 1) / 2) | 0}`;
  if (s < -MATE_IN_MAX) return `mate -${((MATE + s + 1) / 2) | 0}`;
  return `cp ${s}`;
}
