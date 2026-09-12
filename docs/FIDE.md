# FIDE-aligned rules in Aurora

Implemented:

- Legal movement of all pieces, including castling, en passant, promotion
- Check, checkmate, stalemate
- Threefold repetition (by hash)
- 50-move rule (halfmove clock)
- Insufficient material (K vs K, K+minor vs K, KNN vs K)
- Chess960 back-rank placement (castling rights KQkq when king/rooks on e/a/h)

See `src/rules/fide.js` for result adjudication used by the UI clocks/flags.
