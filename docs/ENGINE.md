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

Knights/kings use attack tables. Sliding pieces use ray bitboards with first-blocker masking. Legality is checked by make/unmake and `inCheck` of the opponent-to-the-mover (the side that just moved).

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
- 50-move, repetition, insufficient material, minor-piece draws
- Weighted opening book (first ~12 moves)
- UCI time management: remaining / moves-to-go + increment

## Evaluation (tapered MG/EG)

Material, piece-square tables, mobility, bishop pair, rook on (semi)open file, king pawn shield, tropism, doubled/isolated/passed pawns, plus specialized KQK/KRK/KPK/KBNK terms when the game phase is low.

## Protocol

UCI: `uci`, `isready`, `position`, `go` (wtime/btime/movetime/depth/infinite), `stop`, `quit`, `d`.

## Limits vs Stockfish

Stockfish uses NNUE (tens of millions of trained weights), magic bitboards, handcrafted + NN fusion, SMP, syzygy, and highly tuned search constants in C++. Aurora is the same *pipeline* in JS: correct tactics at short horizons, opening book, classical eval. Strength scales with think time; it is not SF 17.
