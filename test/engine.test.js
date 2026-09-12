import { Position, parseUci, moveToUci } from '../src/engine/position.js';
import { START_FEN } from '../src/engine/const.js';
import { perft } from '../src/engine/perft.js';
import { moveToSan, parseSan } from '../src/engine/san.js';
import { parsePgn, gameToPgn } from '../src/engine/pgn.js';
import { Searcher } from '../src/engine/search.js';
import { evaluate } from '../src/engine/eval.js';
import { probeBook } from '../src/engine/book.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed++;
    console.error('FAIL', msg);
  } else console.log('ok ', msg);
}

const pos = new Position();

assert(perft(pos, 1) === 20, 'perft 1 start');
assert(perft(pos, 2) === 400, 'perft 2 start');
assert(perft(pos, 3) === 8902, 'perft 3 start');
assert(perft(pos, 4) === 197281, 'perft 4 start');

const kiwipete = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1';
pos.setFen(kiwipete);
assert(perft(pos, 1) === 48, 'kiwipete perft 1');
assert(perft(pos, 2) === 2039, 'kiwipete perft 2');
assert(perft(pos, 3) === 97862, 'kiwipete perft 3');

pos.setFen('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1');
assert(perft(pos, 3) === 2812, 'pos3 perft 3');

pos.setFen('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1');
assert(perft(pos, 2) === 264, 'pos4 perft 2');

pos.setFen(START_FEN);
const e4 = parseUci(pos, 'e2e4');
assert(!!e4, 'parse e2e4');
assert(moveToSan(pos, e4) === 'e4', 'SAN e4');
pos.makeMove(e4);
assert(parseSan(pos, 'e5'), 'parse SAN e5');
pos.makeMove(parseSan(pos, 'e5'));
assert(moveToSan(pos, parseUci(pos, 'g1f3')).startsWith('N'), 'SAN Nf3');

pos.setFen(START_FEN);
const pgn = gameToPgn({
  moves: [parseUci(pos, 'e2e4')].map((m) => {
    pos.makeMove(m);
    return m;
  }),
});
assert(pgn.includes('e4'), 'pgn contains e4');
const parsed = parsePgn('[White "A"]\n[Black "B"]\n\n1. e4 e5 2. Nf3 *');
assert(parsed.uci.length === 3, 'pgn parse 3 moves');

pos.setFen(START_FEN);
assert(Math.abs(evaluate(pos)) < 80, 'start eval ~0');
assert(!!probeBook(pos.fen()), 'book hit start');

pos.setFen('6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1');
const s = new Searcher();
s.useBook = false;
const r = s.search(pos, { time: 400, depth: 8, useBook: false });
assert(moveToUci(r.move) === 'e1e8', 'finds back-rank mate Re8#');

pos.setFen(START_FEN);
const fen1 = pos.fen();
pos.makeMove(parseUci(pos, 'e2e4'));
pos.undoMove();
assert(pos.fen() === fen1, 'undo restores fen');

if (failed) {
  console.error(failed, 'failures');
  process.exit(1);
}
console.log('all tests passed');
