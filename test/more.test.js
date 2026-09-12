import { backRank960, chess960Fen } from '../src/engine/chess960.js';
import { probeOpening, openingName, OPENING_LINES } from '../src/engine/openings.js';
import { allocateTime } from '../src/engine/timeman.js';
import { Position } from '../src/engine/position.js';
import { perft } from '../src/engine/perft.js';
import { Searcher } from '../src/engine/search.js';
import { moveToUci } from '../src/engine/position.js';

let failed = 0;
function assert(c, m) {
  if (!c) { failed++; console.error('FAIL', m); }
  else console.log('ok ', m);
}

assert(backRank960(518) === 'RNBQKBNR', '960 id 518 is standard');
assert(chess960Fen(518).startsWith('rnbqkbnr/pppppppp'), '960 fen 518');
const seen = new Set();
for (let i = 0; i < 960; i++) seen.add(backRank960(i));
assert(seen.size === 960, '960 unique back ranks: ' + seen.size);

assert(OPENING_LINES.length > 50, 'opening encyclopedia size');
const first = probeOpening([]);
assert(typeof first === 'string' && first.length === 4, 'book first move ' + first);
assert(openingName(['e2e4', 'c7c5']).name.includes('Sicilian'), 'ECO Sicilian');

assert(allocateTime({ movetime: 1000 }) < 1000, 'movetime overhead');
assert(allocateTime({ wtime: 60000, side: 0 }) > 100, 'wtime split');

const pos = new Position();
pos.setFen('rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3');
assert(perft(pos, 2) > 400, 'petrov perft2');

pos.setFen('6k1/5ppp/8/8/8/8/5PPP/4Q1K1 w - - 0 1');
const s = new Searcher();
s.useBook = false;
const r = s.search(pos, { time: 300, depth: 6, useBook: false });
assert(moveToUci(r.move) === 'e1e8', 'queen back rank');

if (failed) { console.error(failed, 'failures'); process.exit(1); }
console.log('more tests passed');
