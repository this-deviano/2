import { sqFile } from './const.js';
import { Z_PIECE, Z_CASTLE, Z_EP, Z_SIDE } from './zobrist.js';
import { bit, lsb } from './bitboard.js';

/** Approximate Polyglot-style key from our Zobrist (not binary-compatible with the 2004 book). */
export function polyglotKey(pos) {
  return pos.hash;
}

export function dumpBookKey(pos) {
  return pos.hash.toString(16).padStart(16, '0');
}

export function pieceList(pos) {
  const out = [];
  for (let c = 0; c < 2; c++) {
    for (let p = 0; p < 6; p++) {
      let bb = pos.bb[c][p];
      while (bb) {
        const s = lsb(bb);
        bb ^= bit(s);
        out.push({ color: c, type: p, sq: s });
      }
    }
  }
  return out;
}

void Z_PIECE; void Z_CASTLE; void Z_EP; void Z_SIDE; void sqFile;
