# UCI

```
uci
isready
ucinewgame
setoption name OwnBook value true
position startpos moves e2e4 e7e5
position fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 moves e2e4
go wtime 60000 btime 60000 winc 0 movestogo 40
go movetime 1000
go depth 10
stop
d
quit
```

Info lines: `info depth … score cp|mate … nodes … nps … time … pv …`
