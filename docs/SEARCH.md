# Search

Pipeline per iteration depth `d`:

1. Probe opening book (ECO lines + FEN map) if `fullmove ≤ 16`
2. Aspiration window around previous score (±40)
3. Principal-variation search (full window on first move, zero window elsewhere)
4. Hash probe (exact / lower / upper)
5. Reverse futility (eval − 70d ≥ β)
6. Razor into quiescence when eval is far below α
7. Null-move prune (R = 2 or 3)
8. Check extension (+1)
9. LMR on late quiet moves
10. Killers + history on fail-high quiets
11. Quiescence with delta pruning and SEE discard of losing captures
12. Store TT, extract PV by following hash moves

Delta pruning in quiescence skips a capture when even adding the victim's full value
and `SP.DELTA_PRUNE` cannot lift the stand-pat score up to alpha. Promotions are exempt.
Measured at fixed depth it removes ~6% of nodes without changing the chosen move.

Every constant above lives in `src/engine/search-params.js` and all of them are read by
the search — `test/slow.test.js` exercises the paths that use them.

Time: `allocateTime` in `timeman.js` using remaining / moves-to-go + increment.
