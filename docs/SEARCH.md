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
11. Quiescence with SEE discard of losing captures
12. Store TT, extract PV by following hash moves

Time: `allocateTime` in `timeman.js` using remaining / moves-to-go + increment.
