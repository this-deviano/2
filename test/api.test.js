import { validateFen } from '../src/engine/fen.js';
import { probeTb } from '../src/engine/tb.js';
import { expectedScore, updateElo } from '../src/engine/elo.js';
import { Aurora } from '../src/api/chess.js';
import { Position } from '../src/engine/position.js';
import { perft } from '../src/engine/perft.js';
import { START_FEN } from '../src/engine/const.js';
import { FAMOUS_GAMES } from '../src/db/games.js';
import { parsePgn } from '../src/engine/pgn.js';
import { skillToLimits } from '../src/engine/skill.js';

let failed = 0;
function assert(c, m) {
  if (!c) { failed++; console.error('FAIL', m); }
  else console.log('ok ', m);
}

assert(validateFen(START_FEN).ok, 'start fen ok');
assert(!validateFen('8/8/8/8/8/8/8/8 w - - 0 1').ok, 'no kings invalid');

const pos = new Position();
pos.setFen('8/8/8/4k3/8/8/4Q3/4K3 w - - 0 1');
assert(probeTb(pos) === 2, 'KQK white win TB');

assert(expectedScore(1500, 1500) === 0.5, 'elo expect 50');
const u = updateElo(1500, 1500, 1);
assert(u.a > 1500 && u.b < 1500, 'elo update');

const a = new Aurora();
assert(a.legal().length === 20, 'api legal 20');
assert(a.play('e2e4'), 'api e4');
assert(a.fen().includes('4P3'), 'fen after e4');
a.undo();
assert(a.legal().length === 20, 'undo');

assert(skillToLimits(20).noise === 0, 'skill 20 no noise');
assert(skillToLimits(0).depth >= 2, 'skill 0 depth');

pos.setFen(START_FEN);
assert(perft(pos, 3) === 8902, 'magics still perft3');

const opera = parsePgn(FAMOUS_GAMES[0].pgn);
assert(opera.uci.length >= 10, 'opera pgn parsed ' + opera.uci.length);

if (failed) { console.error(failed, 'failures'); process.exit(1); }
console.log('api tests passed');
