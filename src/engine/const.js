export const WHITE = 0;
export const BLACK = 1;

export const PAWN = 0;
export const KNIGHT = 1;
export const BISHOP = 2;
export const ROOK = 3;
export const QUEEN = 4;
export const KING = 5;

export const PIECE_CHARS = 'PNBRQKpnbrqk';

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const SQ = {
  a1: 0, b1: 1, c1: 2, d1: 3, e1: 4, f1: 5, g1: 6, h1: 7,
  a8: 56, b8: 57, c8: 58, d8: 59, e8: 60, f8: 61, g8: 62, h8: 63,
};

export const FILE_A = 0x0101010101010101n;
export const FILE_H = 0x8080808080808080n;
export const RANK_1 = 0x00000000000000FFn;
export const RANK_2 = 0x000000000000FF00n;
export const RANK_7 = 0x00FF000000000000n;
export const RANK_8 = 0xFF00000000000000n;

export const CASTLE_WK = 1;
export const CASTLE_WQ = 2;
export const CASTLE_BK = 4;
export const CASTLE_BQ = 8;

export function sqFile(s) { return s & 7; }
export function sqRank(s) { return s >> 3; }
export function makeSq(f, r) { return r * 8 + f; }

export function sqName(s) {
  return 'abcdefgh'[s & 7] + (1 + (s >> 3));
}

export function parseSq(n) {
  return (n.charCodeAt(0) - 97) + 8 * (n.charCodeAt(1) - 49);
}

export const PIECE_VAL = [100, 320, 330, 500, 900, 20000];

export const INF = 30000;
export const MATE = 20000;
export const MATE_IN_MAX = 19000;

export const PROMO_KNIGHT = 1;
export const PROMO_BISHOP = 2;
export const PROMO_ROOK = 3;
export const PROMO_QUEEN = 4;
