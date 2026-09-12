import { Position } from '../src/engine/position.js';
import { perft } from '../src/engine/perft.js';
import { START_FEN } from '../src/engine/const.js';
import { gameResult } from '../src/rules/fide.js';
import { squareControl, hangingPieces } from '../src/engine/control.js';
import { TransTable } from '../src/engine/tt.js';
import { Replay } from '../src/ui/replay.js';

let failed = 0;
function assert(c, m) {
  if (!c) { failed++; console.error('FAIL', m); }
  else console.log('ok ', m);
}

const pos = new Position();
assert(perft(pos, 4) === 197281, 'perft4 still');
pos.setFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');
assert(perft(pos, 3) === 97862, 'kiwipete3 still');

pos.setFen('6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1');
const r = gameResult(pos);
assert(r.result === '*', 'not over yet');
pos.setFen('6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1');

pos.setFen(START_FEN);
const sc = squareControl(pos);
assert(sc.white === sc.black, 'symmetric control start');
assert(hangingPieces(pos, 0).length === 0, 'no hanging start');

const tt = new TransTable(1);
tt.put(1n, 5, 12, 0, 123);
assert(tt.get(1n).move === 123, 'tt roundtrip');

const rep = new Replay(['e2e4', 'e7e5']);
assert(rep.fens.length === 3, 'replay fens');
assert(rep.back().includes('4P3'), 'replay back');

if (failed) { console.error(failed, 'failures'); process.exit(1); }
console.log('legal tests passed');
