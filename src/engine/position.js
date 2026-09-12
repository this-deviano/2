import {
  WHITE, BLACK, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING,
  START_FEN, CASTLE_WK, CASTLE_WQ, CASTLE_BK, CASTLE_BQ,
  parseSq, sqName, sqFile, sqRank,
  PROMO_KNIGHT, PROMO_BISHOP, PROMO_ROOK, PROMO_QUEEN,
} from './const.js';
import {
  bit, lsb, popcount, KNIGHT_ATK, KING_ATK, PAWN_ATK,
  bishopAttacks, rookAttacks, queenAttacks, between,
} from './bitboard.js';
import { Z_PIECE, Z_CASTLE, Z_EP, Z_SIDE } from './zobrist.js';

export function encodeMove(from, to, promo = 0, flags = 0) {
  return from | (to << 6) | (promo << 12) | (flags << 16);
}
export function moveFrom(m) { return m & 63; }
export function moveTo(m) { return (m >> 6) & 63; }
export function movePromo(m) { return (m >> 12) & 7; }
export function moveFlags(m) { return (m >> 16) & 15; }

export const MF_CAPTURE = 1;
export const MF_EP = 2;
export const MF_CASTLE = 4;
export const MF_DPUSH = 8;

const PROMO_MAP = { 1: KNIGHT, 2: BISHOP, 3: ROOK, 4: QUEEN };

export class Position {
  constructor() {
    this.bb = [new Array(6).fill(0n), new Array(6).fill(0n)];
    this.occ = [0n, 0n];
    this.all = 0n;
    this.side = WHITE;
    this.castle = 0;
    this.ep = -1;
    this.halfmove = 0;
    this.fullmove = 1;
    this.hash = 0n;
    this.history = [];
    this.rep = [];
    this.setFen(START_FEN);
  }

  clone() {
    const p = new Position();
    p.bb = [this.bb[0].slice(), this.bb[1].slice()];
    p.occ = [this.occ[0], this.occ[1]];
    p.all = this.all;
    p.side = this.side;
    p.castle = this.castle;
    p.ep = this.ep;
    p.halfmove = this.halfmove;
    p.fullmove = this.fullmove;
    p.hash = this.hash;
    p.history = this.history.slice();
    p.rep = this.rep.slice();
    return p;
  }

  setFen(fen) {
    this.bb = [new Array(6).fill(0n), new Array(6).fill(0n)];
    this.occ = [0n, 0n];
    this.all = 0n;
    this.hash = 0n;
    this.history = [];
    this.rep = [];
    const parts = fen.trim().split(/\s+/);
    const rows = parts[0].split('/');
    let r = 7;
    for (const row of rows) {
      let f = 0;
      for (const ch of row) {
        if (ch >= '1' && ch <= '8') f += +ch;
        else {
          const black = ch === ch.toLowerCase();
          const c = black ? BLACK : WHITE;
          const map = { p: PAWN, n: KNIGHT, b: BISHOP, r: ROOK, q: QUEEN, k: KING };
          const pt = map[ch.toLowerCase()];
          const sq = r * 8 + f;
          this.bb[c][pt] |= bit(sq);
          this.hash ^= Z_PIECE[c][pt][sq];
          f++;
        }
      }
      r--;
    }
    this.recalcOcc();
    this.side = parts[1] === 'b' ? BLACK : WHITE;
    if (this.side === BLACK) this.hash ^= Z_SIDE;
    this.castle = 0;
    const cr = parts[2] || '-';
    if (cr.includes('K')) this.castle |= CASTLE_WK;
    if (cr.includes('Q')) this.castle |= CASTLE_WQ;
    if (cr.includes('k')) this.castle |= CASTLE_BK;
    if (cr.includes('q')) this.castle |= CASTLE_BQ;
    this.hash ^= Z_CASTLE[this.castle];
    this.ep = parts[3] && parts[3] !== '-' ? parseSq(parts[3]) : -1;
    if (this.ep >= 0) this.hash ^= Z_EP[sqFile(this.ep)];
    this.halfmove = parts[4] ? +parts[4] : 0;
    this.fullmove = parts[5] ? +parts[5] : 1;
    this.rep = [this.hash];
  }

  fen() {
    const map = ['PNBRQK', 'pnbrqk'];
    let s = '';
    for (let r = 7; r >= 0; r--) {
      let empty = 0;
      for (let f = 0; f < 8; f++) {
        const sq = r * 8 + f;
        let ch = null;
        for (let c = 0; c < 2; c++) {
          for (let p = 0; p < 6; p++) {
            if (this.bb[c][p] & bit(sq)) ch = map[c][p];
          }
        }
        if (!ch) empty++;
        else {
          if (empty) { s += empty; empty = 0; }
          s += ch;
        }
      }
      if (empty) s += empty;
      if (r) s += '/';
    }
    s += this.side === WHITE ? ' w ' : ' b ';
    let cr = '';
    if (this.castle & CASTLE_WK) cr += 'K';
    if (this.castle & CASTLE_WQ) cr += 'Q';
    if (this.castle & CASTLE_BK) cr += 'k';
    if (this.castle & CASTLE_BQ) cr += 'q';
    s += (cr || '-') + ' ';
    s += this.ep >= 0 ? sqName(this.ep) : '-';
    s += ` ${this.halfmove} ${this.fullmove}`;
    return s;
  }

  recalcOcc() {
    this.occ[0] = this.bb[0][0] | this.bb[0][1] | this.bb[0][2] | this.bb[0][3] | this.bb[0][4] | this.bb[0][5];
    this.occ[1] = this.bb[1][0] | this.bb[1][1] | this.bb[1][2] | this.bb[1][3] | this.bb[1][4] | this.bb[1][5];
    this.all = this.occ[0] | this.occ[1];
  }

  pieceOn(sq) {
    const b = bit(sq);
    for (let c = 0; c < 2; c++) {
      for (let p = 0; p < 6; p++) {
        if (this.bb[c][p] & b) return { color: c, type: p };
      }
    }
    return null;
  }

  /** Piece type on `sq`, or -1. Same scan as pieceOn() without allocating. */
  pieceTypeOn(sq) {
    const b = bit(sq);
    for (let c = 0; c < 2; c++) {
      for (let p = 0; p < 6; p++) {
        if (this.bb[c][p] & b) return p;
      }
    }
    return -1;
  }

  /**
   * Bitboard of `by`-coloured pieces attacking `sq`, given occupancy `occ`.
   * `ignore` names squares whose pieces should be treated as absent — needed by
   * legality checks for en passant, where the captured pawn is removed from the
   * board without a full make/undo. Without it the captured pawn still counts as
   * an attacker/blocker and some ep captures are scored illegally.
   */
  attackersTo(sq, by, occ = this.all, ignore = 0n) {
    const them = by;
    const keep = ~ignore;
    const pawn = this.bb[them][PAWN] & keep;
    const knight = this.bb[them][KNIGHT] & keep;
    const king = this.bb[them][KING] & keep;
    const slider = (this.bb[them][QUEEN] & keep);
    let atk = PAWN_ATK[them ^ 1][sq] & pawn;
    atk |= KNIGHT_ATK[sq] & knight;
    atk |= KING_ATK[sq] & king;
    atk |= bishopAttacks(sq, occ) & ((this.bb[them][BISHOP] & keep) | slider);
    atk |= rookAttacks(sq, occ) & ((this.bb[them][ROOK] & keep) | slider);
    return atk;
  }

  inCheck(side = this.side) {
    const k = lsb(this.bb[side][KING]);
    if (k < 0) return true;
    return this.attackersTo(k, side ^ 1) !== 0n;
  }

  squareAttacked(sq, by) {
    return this.attackersTo(sq, by) !== 0n;
  }

  genMoves(capturesOnly = false) {
    const moves = [];
    const us = this.side;
    const them = us ^ 1;
    const occUs = this.occ[us];
    const occThem = this.occ[them];
    const occ = this.all;
    const empty = ~occ;

    const add = (from, to, promo = 0, flags = 0) => {
      if (occThem & bit(to)) flags |= MF_CAPTURE;
      moves.push(encodeMove(from, to, promo, flags));
    };

    let pawns = this.bb[us][PAWN];
    while (pawns) {
      const from = lsb(pawns);
      pawns ^= bit(from);
      const atk = PAWN_ATK[us][from] & occThem;
      let a = atk;
      while (a) {
        const to = lsb(a);
        a ^= bit(to);
        const rank = sqRank(to);
        if (rank === 0 || rank === 7) {
          add(from, to, PROMO_QUEEN, MF_CAPTURE);
          add(from, to, PROMO_ROOK, MF_CAPTURE);
          add(from, to, PROMO_BISHOP, MF_CAPTURE);
          add(from, to, PROMO_KNIGHT, MF_CAPTURE);
        } else add(from, to, 0, MF_CAPTURE);
      }
      if (this.ep >= 0 && (PAWN_ATK[us][from] & bit(this.ep))) {
        add(from, this.ep, 0, MF_EP | MF_CAPTURE);
      }
      if (!capturesOnly) {
        const dir = us === WHITE ? 8 : -8;
        const to = from + dir;
        if (to >= 0 && to < 64 && !(occ & bit(to))) {
          const rank = sqRank(to);
          if (rank === 0 || rank === 7) {
            add(from, to, PROMO_QUEEN);
            add(from, to, PROMO_ROOK);
            add(from, to, PROMO_BISHOP);
            add(from, to, PROMO_KNIGHT);
          } else {
            add(from, to);
            const start = us === WHITE ? 1 : 6;
            if (sqRank(from) === start) {
              const to2 = from + dir * 2;
              if (!(occ & bit(to2))) add(from, to2, 0, MF_DPUSH);
            }
          }
        }
      }
    }

    const genSlider = (bb, attacks) => {
      let x = bb;
      while (x) {
        const from = lsb(x);
        x ^= bit(from);
        let att = attacks(from, occ) & ~occUs;
        if (capturesOnly) att &= occThem;
        while (att) {
          const to = lsb(att);
          att ^= bit(to);
          add(from, to);
        }
      }
    };

    genSlider(this.bb[us][KNIGHT], (from) => KNIGHT_ATK[from]);
    genSlider(this.bb[us][BISHOP], bishopAttacks);
    genSlider(this.bb[us][ROOK], rookAttacks);
    genSlider(this.bb[us][QUEEN], queenAttacks);
    genSlider(this.bb[us][KING], (from) => KING_ATK[from]);

    if (!capturesOnly) {
      if (us === WHITE) {
        if ((this.castle & CASTLE_WK) && !(occ & (bit(5) | bit(6))) &&
            !this.squareAttacked(4, BLACK) && !this.squareAttacked(5, BLACK) && !this.squareAttacked(6, BLACK)) {
          add(4, 6, 0, MF_CASTLE);
        }
        if ((this.castle & CASTLE_WQ) && !(occ & (bit(1) | bit(2) | bit(3))) &&
            !this.squareAttacked(4, BLACK) && !this.squareAttacked(3, BLACK) && !this.squareAttacked(2, BLACK)) {
          add(4, 2, 0, MF_CASTLE);
        }
      } else {
        if ((this.castle & CASTLE_BK) && !(occ & (bit(61) | bit(62))) &&
            !this.squareAttacked(60, WHITE) && !this.squareAttacked(61, WHITE) && !this.squareAttacked(62, WHITE)) {
          add(60, 62, 0, MF_CASTLE);
        }
        if ((this.castle & CASTLE_BQ) && !(occ & (bit(57) | bit(58) | bit(59))) &&
            !this.squareAttacked(60, WHITE) && !this.squareAttacked(59, WHITE) && !this.squareAttacked(58, WHITE)) {
          add(60, 58, 0, MF_CASTLE);
        }
      }
    }
    return moves;
  }

  /** Every legal move. Uses the occupancy-based check, not make/undo. */
  legalMoves() {
    const raw = this.genMoves(false);
    const legal = [];
    for (const m of raw) {
      if (this.isLegalFast(m)) legal.push(m);
    }
    return legal;
  }

  /** Keep only the legal moves from an already-generated list. */
  filterLegal(moves) {
    const legal = [];
    for (const m of moves) {
      if (this.isLegalFast(m)) legal.push(m);
    }
    return legal;
  }

  /**
   * Reference legality test: play the move, see if the king is left in check,
   * take it back. Correct but slow — kept as the ground truth that tests compare
   * isLegalFast() against. Hot paths should use isLegalFast()/filterLegal().
   */
  isLegal(m) {
    this.makeMove(m);
    const ok = !this.inCheck(this.side ^ 1);
    this.undoMove();
    return ok;
  }

  /**
   * Legality without make/undo: rebuild occupancy for the hypothetical move and
   * ask whether our king would be attacked. Much cheaper than isLegal() and safe
   * for en passant, where the captured pawn is excluded via `ignore`.
   */
  isLegalFast(m) {
    const from = moveFrom(m);
    const to = moveTo(m);
    const flags = moveFlags(m);
    const us = this.side;
    const them = us ^ 1;
    const movingType = this.pieceTypeOn(from);
    if (movingType < 0) return false;
    let occ = this.all ^ bit(from);
    let ignore = 0n;
    let capSq = to;
    if (flags & MF_EP) capSq = us === WHITE ? to - 8 : to + 8;
    if ((flags & MF_EP) || (this.occ[them] & bit(to))) {
      occ ^= bit(capSq);
      ignore |= bit(capSq);
    }
    occ |= bit(to);
    if (flags & MF_CASTLE) {
      if (to === 6) occ ^= bit(7) | bit(5);
      if (to === 2) occ ^= bit(0) | bit(3);
      if (to === 62) occ ^= bit(63) | bit(61);
      if (to === 58) occ ^= bit(56) | bit(59);
    }
    const ksq = movingType === KING ? to : lsb(this.bb[us][KING]);
    return this.attackersTo(ksq, them, occ, ignore) === 0n;
  }

  makeMove(m) {
    const from = moveFrom(m);
    const to = moveTo(m);
    const promo = movePromo(m);
    const flags = moveFlags(m);
    const us = this.side;
    const them = us ^ 1;

    const snap = {
      m, castle: this.castle, ep: this.ep, halfmove: this.halfmove,
      hash: this.hash, captured: null, capturedSq: to,
    };

    this.hash ^= Z_CASTLE[this.castle];
    if (this.ep >= 0) this.hash ^= Z_EP[sqFile(this.ep)];

    const moving = this.pieceOn(from);
    if (!moving) {
      this.history.push(snap);
      return;
    }

    this.halfmove++;
    if (moving.type === PAWN) this.halfmove = 0;

    let capSq = to;
    if (flags & MF_EP) capSq = us === WHITE ? to - 8 : to + 8;
    const cap = this.pieceOn(capSq);
    if (cap && cap.color === them) {
      this.bb[them][cap.type] ^= bit(capSq);
      this.hash ^= Z_PIECE[them][cap.type][capSq];
      snap.captured = cap;
      snap.capturedSq = capSq;
      this.halfmove = 0;
    }

    this.bb[us][moving.type] ^= bit(from);
    this.hash ^= Z_PIECE[us][moving.type][from];

    let placeType = moving.type;
    if (promo) placeType = PROMO_MAP[promo];
    this.bb[us][placeType] |= bit(to);
    this.hash ^= Z_PIECE[us][placeType][to];

    if (flags & MF_CASTLE) {
      if (to === 6) { this.bb[WHITE][ROOK] ^= bit(7) | bit(5); this.hash ^= Z_PIECE[WHITE][ROOK][7] ^ Z_PIECE[WHITE][ROOK][5]; }
      if (to === 2) { this.bb[WHITE][ROOK] ^= bit(0) | bit(3); this.hash ^= Z_PIECE[WHITE][ROOK][0] ^ Z_PIECE[WHITE][ROOK][3]; }
      if (to === 62) { this.bb[BLACK][ROOK] ^= bit(63) | bit(61); this.hash ^= Z_PIECE[BLACK][ROOK][63] ^ Z_PIECE[BLACK][ROOK][61]; }
      if (to === 58) { this.bb[BLACK][ROOK] ^= bit(56) | bit(59); this.hash ^= Z_PIECE[BLACK][ROOK][56] ^ Z_PIECE[BLACK][ROOK][59]; }
    }

    this.ep = -1;
    if (flags & MF_DPUSH) this.ep = us === WHITE ? from + 8 : from - 8;

    if (from === 4 || to === 4) this.castle &= ~(CASTLE_WK | CASTLE_WQ);
    if (from === 60 || to === 60) this.castle &= ~(CASTLE_BK | CASTLE_BQ);
    if (from === 0 || to === 0) this.castle &= ~CASTLE_WQ;
    if (from === 7 || to === 7) this.castle &= ~CASTLE_WK;
    if (from === 56 || to === 56) this.castle &= ~CASTLE_BQ;
    if (from === 63 || to === 63) this.castle &= ~CASTLE_BK;

    this.hash ^= Z_CASTLE[this.castle];
    if (this.ep >= 0) this.hash ^= Z_EP[sqFile(this.ep)];
    this.hash ^= Z_SIDE;

    this.recalcOcc();
    this.side = them;
    if (us === BLACK) this.fullmove++;
    this.history.push(snap);
    this.rep.push(this.hash);
  }

  undoMove() {
    const snap = this.history.pop();
    if (!snap) return;
    this.rep.pop();
    const m = snap.m;
    const from = moveFrom(m);
    const to = moveTo(m);
    const promo = movePromo(m);
    const flags = moveFlags(m);
    this.side ^= 1;
    const us = this.side;
    const them = us ^ 1;
    if (us === BLACK) this.fullmove--;

    const movingType = promo ? PROMO_MAP[promo] : this.pieceOn(to)?.type;
    if (movingType == null) {
      this.castle = snap.castle;
      this.ep = snap.ep;
      this.halfmove = snap.halfmove;
      this.hash = snap.hash;
      this.recalcOcc();
      return;
    }

    this.bb[us][movingType] ^= bit(to);
    const orig = promo ? PAWN : movingType;
    this.bb[us][orig] |= bit(from);

    if (flags & MF_CASTLE) {
      if (to === 6) this.bb[WHITE][ROOK] ^= bit(7) | bit(5);
      if (to === 2) this.bb[WHITE][ROOK] ^= bit(0) | bit(3);
      if (to === 62) this.bb[BLACK][ROOK] ^= bit(63) | bit(61);
      if (to === 58) this.bb[BLACK][ROOK] ^= bit(56) | bit(59);
    }

    if (snap.captured) {
      this.bb[them][snap.captured.type] |= bit(snap.capturedSq);
    }

    this.castle = snap.castle;
    this.ep = snap.ep;
    this.halfmove = snap.halfmove;
    this.hash = snap.hash;
    this.recalcOcc();
  }

  isRepetition() {
    const h = this.hash;
    let n = 0;
    for (let i = this.rep.length - 3; i >= 0; i -= 1) {
      if (this.rep[i] === h) n++;
      if (n >= 2) return true;
    }
    return false;
  }

  insufficientMaterial() {
    if (this.bb[0][PAWN] | this.bb[1][PAWN] | this.bb[0][ROOK] | this.bb[1][ROOK] | this.bb[0][QUEEN] | this.bb[1][QUEEN]) return false;
    const wn = popcount(this.bb[0][KNIGHT]);
    const bn = popcount(this.bb[1][KNIGHT]);
    const wb = popcount(this.bb[0][BISHOP]);
    const bb = popcount(this.bb[1][BISHOP]);
    const n = wn + bn + wb + bb;
    return n <= 1 || (n === 2 && wn + bn === 2);
  }
}

export function moveToUci(m) {
  const p = movePromo(m);
  const letters = ['', 'n', 'b', 'r', 'q'];
  return sqName(moveFrom(m)) + sqName(moveTo(m)) + letters[p];
}

export function parseUci(pos, uci) {
  const from = parseSq(uci.slice(0, 2));
  const to = parseSq(uci.slice(2, 4));
  const pr = uci[4];
  const promo = pr === 'n' ? 1 : pr === 'b' ? 2 : pr === 'r' ? 3 : pr === 'q' ? 4 : 0;
  for (const m of pos.legalMoves()) {
    if (moveFrom(m) === from && moveTo(m) === to && movePromo(m) === promo) return m;
  }
  return 0;
}
