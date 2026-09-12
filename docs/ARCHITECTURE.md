# Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│  3D / 2D UI │────▶│  Web Worker  │────▶│  Searcher  │
│  trainer    │     │  UCI-like    │     │  PVS + TT  │
│  rush/edit  │     └──────────────┘     └─────┬──────┘
└─────────────┘                                │
       │                         ┌─────────────┼─────────────┐
       ▼                         ▼             ▼             ▼
┌─────────────┐            Position      Evaluate       Book/ECO
│ Aurora API  │            bitboards     HCE+NNUE       Chess960
│ src/api     │            magics        TB 3-man       Skill
└─────────────┘            make/unmake   KPK            MultiPV
```

Attack generation: occupancy-indexed bishop/rook tables (`BISHOP_TAB` / `ROOK_TAB`) filled at startup from ray slides.

Search: iterative deepening → aspiration → PVS → RFP/razor/NMP/LMR → SEE qsearch.

Eval: material/PST/mobility/pawns/king + NNUE 768×32 + 3-man TB + KPK.
