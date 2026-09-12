export const LESSONS = [
  {
    id: 'rules-king',
    title: 'The king',
    fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
    text: 'The king moves one square in any direction. Two kings can never stand adjacent. Check means the king is attacked; you must escape.',
  },
  {
    id: 'rules-pawn',
    title: 'Pawns',
    fen: '8/8/8/8/8/8/4P3/4K3 w - - 0 1',
    text: 'Pawns walk forward, capture diagonally, and may step two squares from the home rank. Promotion awaits on the last rank.',
  },
  {
    id: 'rules-knight',
    title: 'Knights',
    fen: '8/8/8/8/8/8/8/4K1N1 w - - 0 1',
    text: 'Knights jump in an L: two then one. They are the only piece that leaps.',
  },
  {
    id: 'rules-bishop',
    title: 'Bishops',
    fen: '8/8/8/8/8/8/8/2B1K3 w - - 0 1',
    text: 'Bishops stay on one color forever. The pair controls both hues of the board.',
  },
  {
    id: 'rules-rook',
    title: 'Rooks',
    fen: '8/8/8/8/8/8/8/R3K3 w Q - 0 1',
    text: 'Rooks travel ranks and files. Two rooks on the seventh often decide the game.',
  },
  {
    id: 'rules-queen',
    title: 'The queen',
    fen: '8/8/8/8/8/8/8/3QK3 w - - 0 1',
    text: 'Queen = rook + bishop. She is lethal in open space and fragile if chased by lesser pieces.',
  },
  {
    id: 'castle',
    title: 'Castling',
    fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
    text: 'King two steps toward a rook; the rook hops to the other side. No check, no crossing check, no prior king/rook move.',
  },
  {
    id: 'ep',
    title: 'En passant',
    fen: 'rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3',
    text: 'If a pawn double-steps beside yours, you may capture it as if it had moved one square — but only on the next move.',
  },
  {
    id: 'value',
    title: 'Piece values',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    text: 'Pawn 1, knight/bishop 3, rook 5, queen 9. Bishop pair is a plus. King is priceless.',
  },
  {
    id: 'center',
    title: 'The centre',
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    text: 'e4 and d4 (e5/d5) grant space. Knights belong on f3/c3. Develop, castle, then fight.',
  },
  {
    id: 'end-kqk',
    title: 'Queen mate',
    fen: '8/8/8/4k3/8/8/4Q3/4K3 w - - 0 1',
    text: 'Box the lone king to the edge with the queen a knight-span away, then walk your king in for the kiss of death.',
  },
  {
    id: 'end-krk',
    title: 'Rook mate',
    fen: '8/8/8/4k3/8/8/4R3/4K3 w - - 0 1',
    text: 'Cut a rank with the rook, take the opposition, shrink the box.',
  },
];
