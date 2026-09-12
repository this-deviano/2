/** Win-at-Chess style tactics (bm = UCI). */
export const WAC = [
  { id: 'WAC.001', fen: '2rr3k/pp3pp1/1nnqbN1p/3pN3/2pP4/2P3Q1/PPB4P/R4RK1 w - - 0 1', bm: ['g3g6'] },
  { id: 'mate-back', fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1', bm: ['e1e8'] },
  { id: 'mate-q', fen: '6k1/5ppp/8/8/8/8/5PPP/4Q1K1 w - - 0 1', bm: ['e1e8'] },
  { id: 'mate-2r', fen: '7k/8/8/8/8/8/R7/1R4K1 w - - 0 1', bm: ['a2a8'] },
  { id: 'promo', fen: '8/P7/8/8/8/8/8/k6K w - - 0 1', bm: ['a7a8q'] },
  { id: 'fork', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p1N1/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 4 4', bm: ['g5f7'] },
  { id: 'ep', fen: 'rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3', bm: ['e5f6'] },
  { id: 'hang', fen: 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', bm: ['e4d5'] },
  { id: 'castle', fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5', bm: ['e1g1'] },
  { id: 'r7', fen: '4k3/8/8/8/8/8/1R3PPP/6K1 w - - 0 1', bm: ['b2b7'] },
  { id: 'q-d8', fen: '6k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1', bm: ['d1d8'] },
  { id: 're8', fen: 'r5k1/5ppp/8/8/8/8/5PPP/4RRK1 w - - 0 1', bm: ['e1e8'] },
];
