# Compact NNUE

`src/engine/nnue.js` is a 768→32→1 network:

- Inputs: 12 piece types × 64 squares
- Hidden: clipped ReLU
- Output mixed 5:1 with the handcrafted eval

Weights are **structured + seeded**, not a Stockfish NNUE dump (those are tens of MB and architecture-specific). This is the *shape* of NNUE so you can later drop in trained tensors.
