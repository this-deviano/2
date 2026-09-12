# Aurora engine architecture

## Board

- 12 bitboards (2 colors × 6 piece types) stored as JavaScript `BigInt`
- Occupancy caches `occ[2]` and `all`
- Zobrist 64-bit key: pieces, castling, en passant file, side to move
- Undo stack snapshots castle rights, EP, halfmove, hash, captured piece

Squares are 0–63, a1 = 0, h1 = 7, a8 = 56.

## Move encoding

`from | to<<6 | promo<<12 | flags<<16`

Flags: capture, en passant, castle, double pawn push.

## Generation

Knights/kings use attack tables. Sliding pieces use magic-indexed attack tables
(`BISHOP_TAB`/`ROOK_TAB` in `bitboard.js`).

Legality is checked by `isLegalFast()`: it rebuilds occupancy for the hypothetical
move and asks whether our king would be attacked, instead of make/unmake + `inCheck`.
En passant is handled by passing the captured pawn's square as `ignore` to
`attackersTo()`, so the removed pawn neither blocks nor attacks. `isLegal()` (the slow
make/unmake version) is kept as ground truth — `test/slow.test.js` differentially
compares the two over tens of thousands of moves.

### Performance

Boards are `BigInt`, so the hot primitives avoid BigInt work where they can:

- `bit(sq)` reads a precomputed table rather than evaluating `1n << BigInt(sq)`
- `lsb`/`msb`/`popcount` split the board into two 32-bit numbers and use
  `Math.clz32` / SWAR — no `toString(2)` and no bit-at-a-time BigInt loop
- magic indexing precomputes each mask's bit list and packs the occupancy from the
  32-bit halves; `queenAttacks` splits the BigInt once for both directions
- `between()` is a precomputed 64×64 table
- `nnueEval` reuses one accumulator instead of allocating per call

Measured on Node 22, single thread: ~1.3M nps raw move generation, ~45k nps in search
(midgame). A native engine is orders of magnitude faster because it keeps bitboards in
registers; closing that gap needs a split 32-bit board representation.

## Search

- Iterative deepening
- Principal variation α-β with PVS
- Aspiration windows (±40 cp)
- Transposition table (exact / lower / upper)
- Null-move pruning
- Late move reductions
- Check extensions
- Killer moves + history heuristic
- MVV-LVA + SEE in quiescence
- Delta pruning in quiescence
- Contempt and history-bonus scaling via `search-params.js`
- 50-move, repetition, insufficient material, minor-piece draws
- Weighted opening book (first ~12 moves)
- UCI time management: remaining / moves-to-go + increment

## Evaluation (tapered MG/EG)

Material, piece-square tables, mobility, bishop pair, rook on (semi)open file, king pawn shield, tropism, doubled/isolated/passed pawns, plus specialized KQK/KRK/KPK/KBNK terms when the game phase is low.

## Protocol

UCI: `uci`, `isready`, `position`, `go` (wtime/btime/movetime/depth/infinite), `stop`, `quit`, `d`.

## Limits vs Stockfish

Stockfish uses NNUE (tens of millions of trained weights), magic bitboards, handcrafted + NN fusion, SMP, syzygy, and highly tuned search constants in C++. Aurora is the same *pipeline* in JS: correct tactics at short horizons, opening book, classical eval. Strength scales with think time; it is not SF 17.
