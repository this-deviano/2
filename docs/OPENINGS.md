# Openings

`src/engine/openings.js` stores ECO-tagged UCI lines (Sicilian Najdorf/Sveshnikov/Dragon/Kan, Ruy Lopez Berlin/Marshall, Italian, Evans, French Winawer/Tarrasch/Advance, Caro-Kann, QGD/Slav/Semi-Slav, Grünfeld, KID, Nimzo, Catalan, English, Reti, London, …).

`probeOpening(history)` picks a continuation that matches the game prefix.

`openingName(history)` returns the longest matching ECO name for the UI.

`book.js` still maps some FENs for positions reached by transpositions.
