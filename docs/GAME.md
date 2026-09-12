# 3D game

Vite + Three.js board:

- Orbit camera, shadows, ACES tone mapping
- Lathe/box piece models (pawn through king)
- Click-to-move, legal-square highlights, last-move glow
- Promotion chooser
- Clocks, captured-piece glyphs, eval bar
- Play: White / Black / hotseat / engine vs engine
- Analyze: FEN + PGN load, copy, long search
- Puzzles: mate and tactic positions
- Themes (walnut / ice / emerald), coordinates
- Undo, hint, flip

Engine runs in a Web Worker so the render loop stays at 60 fps.
