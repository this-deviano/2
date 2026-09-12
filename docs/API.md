# Embedding Aurora

```js
import { Aurora } from './src/api/chess.js';

const bot = new Aurora();
bot.play('e2e4');
const r = bot.go({ time: 500 });
bot.analyse(3, 800);
bot.goSkilled(10, { time: 200 });
console.log(bot.opening(), bot.eval(), bot.tb());
```

FEN: `validateFen`. Chess960: `bot.chess960(518)`.
