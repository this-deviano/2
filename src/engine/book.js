/** Compact opening book: FEN (placement + side + castle + ep) → weighted UCI moves. */
export const BOOK = {
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -': [
    ['e2e4', 40], ['d2d4', 35], ['c2c4', 12], ['g1f3', 10], ['g2g3', 3],
  ],
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq -': [
    ['c7c5', 30], ['e7e5', 28], ['e7e6', 14], ['c7c6', 12], ['d7d5', 8], ['g8f6', 8],
  ],
  'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq -': [
    ['g8f6', 35], ['d7d5', 35], ['e7e6', 10], ['c7c5', 10], ['f7f5', 3],
  ],
  'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -': [
    ['g1f3', 45], ['b1c3', 20], ['c2c3', 15], ['d2d4', 12], ['f1c4', 4],
  ],
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -': [
    ['g1f3', 50], ['b1c3', 20], ['f1c4', 15], ['f2f4', 8], ['d2d4', 5],
  ],
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq -': [
    ['b8c6', 70], ['g8f6', 20], ['d7d6', 10],
  ],
  'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq -': [
    ['f1b5', 45], ['f1c4', 25], ['d2d4', 15], ['b1c3', 15],
  ],
  'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq -': [
    ['a7a6', 50], ['g8f6', 25], ['f8c5', 10], ['d7d6', 10], ['f7f5', 5],
  ],
  'rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -': [
    ['c2c4', 50], ['g1f3', 30], ['b1c3', 10], ['c1g5', 10],
  ],
  'rnbqkb1r/pppppppp/5n2/8/2PP4/8/PP2PPPP/RNBQKBNR b KQkq -': [
    ['e7e6', 30], ['g7g6', 25], ['c7c5', 20], ['e7e5', 15], ['d7d5', 10],
  ],
  'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -': [
    ['d2d4', 70], ['d2d3', 10], ['g1f3', 10], ['b1c3', 10],
  ],
  'rnbqkbnr/pppp1ppp/4p3/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq -': [
    ['d7d5', 90], ['c7c5', 10],
  ],
  'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -': [
    ['c2c4', 45], ['g1f3', 35], ['b1c3', 10], ['c1f4', 10],
  ],
  'rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq -': [
    ['b1c3', 40], ['e4d5', 30], ['e4e5', 20], ['f1d3', 10],
  ],
  'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -': [
    ['e4d5', 80], ['e4e5', 15], ['b1c3', 5],
  ],
  'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq -': [
    ['e7e5', 30], ['g8f6', 25], ['c7c5', 15], ['e7e6', 15], ['c7c6', 10],
  ],
  'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq -': [
    ['d7d5', 35], ['g8f6', 35], ['c7c5', 15], ['g7g6', 10],
  ],
};

export function bookKey(fen) {
  return fen.split(' ').slice(0, 4).join(' ');
}

export function probeBook(fen, rng = Math.random) {
  const entries = BOOK[bookKey(fen)];
  if (!entries || !entries.length) return null;
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [uci, w] of entries) {
    r -= w;
    if (r <= 0) return uci;
  }
  return entries[0][0];
}
