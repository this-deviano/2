# Evaluation

Tapered: `score = (mg * phase + eg * (24-phase)) / 24` then side-to-move.

Terms:

- Material (100, 320, 330, 500, 900)
- Piece-square tables (MG and EG)
- Mobility (N/B/R/Q)
- Bishop pair
- Rook on open / semi-open file
- Rook on 7th
- Knight outpost (supported on 5th–8th)
- King pawn shield
- King tropism
- Castling rights
- Doubled / isolated / passed pawns
- Specialized KQK, KRK, KPK, KBNK
- Drawish minor-piece detection

Phase weights: N=1 B=1 R=2 Q=4 (max 24).
