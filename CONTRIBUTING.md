# Contributing

1. Keep `npm test` green (perft is the contract).
2. New eval terms belong in `eval.js` or `endgame.js` with a comment.
3. Opening lines: UCI arrays in `openings.js` with ECO codes.
4. Tactics: `{ fen, bm }` in `src/data/wac.js`.
5. Search changes: verify mates in `test/` still hit `e1e8` style shots.

NNUE: replace `W1/W2` in `nnue.js` with trained weights of the same shape.
