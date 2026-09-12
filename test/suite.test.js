import { Position } from '../src/engine/position.js';
import { perft } from '../src/engine/perft.js';
import { PERFT_SUITE } from '../src/data/perft-suite.js';
import { WAC } from '../src/data/wac.js';
import { Searcher } from '../src/engine/search.js';
import { moveToUci } from '../src/engine/position.js';
import { divide } from '../src/engine/divide.js';
import { nnueEval } from '../src/engine/nnue.js';
import { checkers, pinned } from '../src/engine/legal.js';
import { START_FEN } from '../src/engine/const.js';

let failed = 0;
function assert(c, m) {
  if (!c) { failed++; console.error('FAIL', m); }
  else console.log('ok ', m);
}

for (const p of PERFT_SUITE) {
  const pos = new Position();
  pos.setFen(p.fen);
  for (let i = 0; i < p.d.length && i < 2; i++) {
    const n = perft(pos, i + 1);
    assert(n === p.d[i], `${p.name} perft ${i + 1} = ${n} want ${p.d[i]}`);
  }
}

const start = new Position();
const div = divide(start, 2);
assert(div.total === 400, 'divide depth 2');
assert(div.rows.length === 20, '20 root moves');

assert(typeof nnueEval(start) === 'number', 'nnue number');
assert(checkers(start) === 0n, 'no checkers at start');
assert(pinned(start) === 0n, 'no pins at start');

start.setFen('r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR b KQkq - 3 3');
const s = new Searcher();
s.useBook = false;
const r = s.search(start, { time: 200, depth: 4, useBook: false });
assert(!!r.move, 'scholar-ish search returns a move');

const easy = new Position();
easy.setFen(WAC.find((w) => w.id === 'mate-back').fen);
const s2 = new Searcher();
s2.useBook = false;
const r2 = s2.search(easy, { time: 250, depth: 6, useBook: false });
assert(moveToUci(r2.move) === 'e1e8', 'WAC back-rank');

if (failed) { console.error(failed, 'failures'); process.exit(1); }
console.log('suite tests passed');
