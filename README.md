# Aurora Chess

Bitboard engine + 3D/2D platform with UCI, XBoard, CLI, API, ECO, Chess960, NNUE mix, tablebases, trainer, rush, museum, editor, drag-and-drop, premoved, explorer.

```bash
npm install && npm test && npm run dev
node src/cli.js perft 4
node src/cli.js go --time 500
make test
```

## Scripts

`dev` `engine` `xboard` `cli` `test` `bench` `selfplay` `match` `divide` `tournament` `texel`

## Engine

Occupancy magics · tunable `search-params.js` · PVS/TT/NMP/LMR/RFP/SEE · HCE+NNUE · KPK/3-man TB · ECO · 960 · SAN/PGN · FEN · skill · MultiPV · control · annotation · ponder · Texel · Elo tournaments · `Aurora` API · CLI · Docker

Perft-verified. 7 test files.

## Client

3D drag · capture FX · wood/felt · hover · SAN box · clickable move list · replay · full 2D · premoved · explorer · cameras · i18n · settings · lessons · trainer · rush · Morphy/Anderssen/Kasparov · Chess960 · editor · eval graph · PV arrows

Not Stockfish (no trained 10MB net, no C++ SMP, no syzygy).
