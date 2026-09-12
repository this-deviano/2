import { explore } from '../src/modes/explorer.js';
import { datasetLoss } from '../src/engine/texel.js';
import { PremoveQueue } from '../src/modes/premove.js';
import { EXTRA_PUZZLES } from '../src/data/puzzles-extra.js';

let failed = 0;
function assert(c, m) {
  if (!c) { failed++; console.error('FAIL', m); }
  else console.log('ok ', m);
}

const root = explore([]);
assert(root.length > 3, 'explorer root branches');
assert(root.some((r) => r.uci === 'e2e4'), 'e4 in explorer');

const q = new PremoveQueue();
q.set(12, 28);
assert(q.peek().to === 28, 'premove');
q.pop();
assert(!q.peek(), 'premove empty');

assert(EXTRA_PUZZLES.length >= 8, 'extra puzzles');
assert(datasetLoss([{ fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', result: 0.5 }]) < 1, 'texel loss');

if (failed) { console.error(failed, 'failures'); process.exit(1); }
console.log('modes tests passed');
