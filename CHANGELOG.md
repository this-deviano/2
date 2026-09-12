# Changelog

## 1.3.0

### Performance (measured on Node 22, single thread)
- Raw move generation ~265k → ~1.3M nps (~5x). `bit()` now reads a precomputed table
  instead of allocating `1n << BigInt(sq)`; `lsb`/`msb`/`popcount` split the board into
  two 32-bit numbers and use `Math.clz32`/SWAR instead of `toString(2)` and bit-at-a-time
  BigInt loops; magic indexing precomputes each mask's bit list and packs occupancy from
  the 32-bit halves; `queenAttacks` splits the BigInt once; `between()` is a table.
- `legalMoves()` and quiescence use the occupancy-based `isLegalFast()` instead of
  make/unmake per move. Search ~18k → ~45k nps (midgame); depth reached in 5s went from
  8/6/10 to 10/8/12 on the three bench positions.
- `nnueEval()` reuses one accumulator instead of allocating a `Float32Array` per leaf.

### Fixed
- `attackersTo()` silently dropped its fourth `ignore` argument, so the en-passant
  legality path computed attacks against a board where the captured pawn was still
  present. `isLegalFast()` passed `ignore` but nothing consumed it.
- `search-params.js` declared `HISTORY_BONUS`, `CONTEMPT` and `DELTA_PRUNE` but nothing
  read them. All three are now wired; all 13 knobs are live. Delta pruning cuts ~6% of
  nodes at fixed depth without changing the chosen move.
- `bench.js` printed four positions' `info` blocks with no labels, which reads as one
  position's search. Every line now carries the position name and FEN.

### Added
- `trainNNUE()` — real gradient descent on the net's output layer, with before/after loss.
  `texel.js` gained a labelled `DATASET` and a `tune()` that reports the improvement.
- `test/slow.test.js` — perft against six published values (startpos d5, Kiwipete d4,
  CPW 3/4/5/6 at d4–d5), bitboard primitives checked against naive references, magic
  slider attacks checked against a ray walk, `isLegalFast` differentially checked against
  `isLegal` over ~78k moves, a legality assertion on the search's best move, a check that
  Texel training reduces loss, and a test pinning the Chess960 boundary.
- `npm run test:slow`.

### Corrected claims
- README/docs no longer imply a trained NNUE or full Texel tuning: the hidden layer is
  PST-seeded and only the output layer trains, at 1/6 blend weight.
- Chess960 is documented as setup-only. `chess960.js` produces the 960 start positions,
  but castling is hardcoded to standard king/rook squares, so no castling move is
  generated in a 960 game with a non-standard king (asserted in `test/slow.test.js`).

## 1.2.0
- Occupancy attack tables, NNUE mix, 3-man TB, ECO encyclopedia, Chess960
- 3D drag-and-drop, premoved, explorer, trainer, rush, museum, editor, replay
- UCI + XBoard, Aurora API, CLI, Texel, tournaments, i18n, settings

## 1.1.0
- PVS, TT, LMR, NMP, SEE, SAN/PGN, 3D Three.js board

## 1.0.0
- Bitboard core + perft-correct generator
