# Aurora Chess

Bitboard engine + 3D/2D platform with UCI, XBoard, CLI, API, ECO, Chess960 (setup),
3-man tablebases, trainer, rush, museum, editor, drag-and-drop, premoves, explorer.

```bash
npm install && npm test && npm run dev
node src/cli.js perft 4
node src/cli.js go --time 500
make test
```

## Scripts

`dev` `engine` `xboard` `cli` `test` `test:slow` `bench` `selfplay` `match` `divide` `tournament` `texel`

## Engine

Occupancy magics · tunable `search-params.js` · PVS/TT/NMP/LMR/RFP/razoring/SEE ·
delta pruning · aspiration windows · HCE + small neural net · KPK/3-man TB · ECO ·
SAN/PGN · FEN · skill · MultiPV · control · annotation · ponder · Texel tuner ·
Elo tournaments · `Aurora` API · CLI · Docker

Move generation is perft-verified against the published values for the start position
(depth 5), Kiwipete (depth 4), and CPW positions 3–6 (depth 4–5). See `test/slow.test.js`.

### Measured performance

Node throughput on Node 22 (single thread):

| Workload | nps |
| --- | --- |
| Raw move generation (`perft`) | ~1.3M |
| Full search (midgame) | ~45k |
| Full search (endgame) | ~120k |

At 5 seconds per move the search reaches roughly depth 8–12 depending on the position.
That is a solid club-level engine and well short of Stockfish, which reaches depth 20+
in the same time. The gap is structural: boards are `BigInt` because JS `number` has only
53 exact integer bits, so bitboard arithmetic allocates where a native engine uses
registers. The hot paths (`bit`, `lsb`, `popcount`, magic indexing, legality) avoid
BigInt work where they can; closing the rest needs a split 32-bit representation.

### What "NNUE" and "Texel" mean here

Be precise about these two, because the names oversell what is in the box:

- The net is a 12×64 → 32 → 1 network. Its **hidden layer is seeded from piece-square
  tables plus deterministic noise**, not trained on games. `npm run texel` trains the
  **output layer** by gradient descent on a 16-position labelled set, which measurably
  reduces its regression loss but shifts the total evaluation only slightly, because the
  net is blended at 1/6 weight against the hand-crafted eval.
- There is no C++ SMP and no Syzygy. Endgame knowledge is KPK plus a 3-man table.

### Known limitations

- **Chess960 is setup-only.** `chess960.js` generates the 960 starting positions, but
  `position.js` hardcodes castling to the standard king/rook squares, so in a 960 game
  with a non-standard king placement no castling move is ever generated. Verified in
  `test/slow.test.js`.
- `legalMoves()` legality is checked by rebuilding occupancy rather than by pins, which
  is correct (differentially tested against make/undo over 576k moves) but not the
  fastest possible.

## Client

3D drag · capture FX · wood/felt · hover · SAN box · clickable move list · replay ·
full 2D · premoves · explorer · cameras · i18n · settings · lessons · trainer · rush ·
Morphy/Anderssen/Kasparov · Chess960 (setup) · editor · eval graph · PV arrows

Not Stockfish (no trained 10MB net, no C++ SMP, no syzygy).
