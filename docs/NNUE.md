# Compact NNUE

`src/engine/nnue.js` is a 768→32→1 network:

- Inputs: 12 piece types × 64 squares
- Hidden: 32 units, clipped ReLU
- Output mixed 5:1 with the handcrafted eval

## Weights

The **hidden layer is seeded, not trained**: `W1` is built from piece values and a pawn
piece-square table plus deterministic `mulberry32` noise, so the net is reproducible and
slightly better than raw material without needing a multi-GB training dump. This is the
*shape* of NNUE so trained tensors can be dropped in later.

The **output layer can be trained**. `trainNNUE()` runs gradient descent on labelled
positions, regressing the network's centipawn output onto game results mapped to
±`target`. It is wired up as `npm run texel`.

## Tuning, honestly

`npm run texel` reports two numbers:

- *net regression loss* — drops substantially (typically ~50k → ~31k on the bundled
  16-position set). This is the thing the trainer genuinely optimises.
- *total-eval logistic loss* — barely moves. The net is only 1/6 of `evaluate()`, so
  training it shifts the blended score by a few centipawns at most.

So: the trainer works, and its effect on play is small by construction. Growing the
labelled set in `texel.js` (`DATASET`) and raising the net's blend weight are the two
levers that would change that.

## Evaluation call path

`nnueEval()` reuses a single module-level accumulator rather than allocating a
`Float32Array` per call, because it runs once per leaf node.
