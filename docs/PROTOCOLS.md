# Protocols

## UCI (`npm run engine`)

`uci` `isready` `ucinewgame` `position` `go` `stop` `quit` `d`  
Options: Hash, OwnBook, Skill Level, MultiPV, UCI_Chess960

## XBoard / CECP (`node src/engine/xboard.js`)

`xboard` `protover` `new` `setboard` `go` `ping` `force` algebraic moves `quit`

## Embed

```js
import { Aurora } from './src/api/chess.js';
```

Worker messages: `{type:'position',fen}` `{type:'go',time,depth,useBook}` `{type:'stop'}`.
