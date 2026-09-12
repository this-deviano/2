/**
 * Slower regression tests: deep perft against published values, differential
 * checks of the bitboard primitives and of the fast legality path, the Texel
 * trainer, and the current Chess960 boundary.
 *
 * Run with `npm run test:slow` (also part of `npm test`).
 */
import { Position, moveToUci, moveFlags, MF_CASTLE } from '../src/engine/position.js';
import { perft } from '../src/engine/perft.js';
import { bit, lsb, msb, popcount, between, rookAttacks, bishopAttacks, queenAttacks } from '../src/engine/bitboard.js';
import { Searcher } from '../src/engine/search.js';
import { tune, DATASET } from '../src/engine/texel.js';
import { setup960, backRank960 } from '../src/engine/chess960.js';

let failed = 0;
function assert(c, m) {
  if (!c) { failed++; console.error('FAIL', m); }
  else console.log('ok ', m);
}

/* ---------------- perft vs published values ---------------- */

const PERFT_CASES = [
  ['startpos d5', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 5, 4865609],
  ['kiwipete d4', 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', 4, 4085603],
  ['cpw3 d5', '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', 5, 674624],
  ['cpw4 d4', 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1', 4, 422333],
  ['cpw5 d4', 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8', 4, 2103487],
  ['cpw6 d4', 'r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10', 4, 3894594],
];
for (const [name, fen, d, want] of PERFT_CASES) {
  const p = new Position();
  p.setFen(fen);
  assert(perft(p, d) === want, `perft ${name} = ${want}`);
}

/* ---------------- bitboard primitives vs naive references ---------------- */

const naiveLsb = (bb) => { for (let i = 0; i < 64; i++) if (bb & (1n << BigInt(i))) return i; return -1; };
const naiveMsb = (bb) => { for (let i = 63; i >= 0; i--) if (bb & (1n << BigInt(i))) return i; return -1; };
const naivePop = (bb) => { let n = 0; for (let i = 0; i < 64; i++) if (bb & (1n << BigInt(i))) n++; return n; };
function naiveRay(sq, occ, dirs) {
  let out = 0n;
  const f = sq & 7, r = sq >> 3;
  for (const [df, dr] of dirs) {
    let nf = f + df, nr = r + dr;
    while (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
      const t = nr * 8 + nf;
      out |= 1n << BigInt(t);
      if (occ & (1n << BigInt(t))) break;
      nf += df;
      nr += dr;
    }
  }
  return out;
}
const RDIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const BDIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

assert(lsb(0n) === -1 && msb(0n) === -1 && popcount(0n) === 0, 'bitboard empty board');
for (let s = 0; s < 64; s++) {
  if (bit(s) !== (1n << BigInt(s))) { failed++; console.error('FAIL bit(' + s + ')'); }
  if (lsb(bit(s)) !== s || msb(bit(s)) !== s) { failed++; console.error('FAIL scan(' + s + ')'); }
}
console.log('ok   bit/lsb/msb over all 64 squares');

let seed = 20260912n;
const rnd = () => {
  seed = (seed * 6364136223846793005n + 1442695040888963407n) & 0xffffffffffffffffn;
  return seed;
};
let scanBad = 0, sliderBad = 0;
for (let t = 0; t < 4000; t++) {
  const bb = rnd() >> BigInt(t % 40);
  if (lsb(bb) !== naiveLsb(bb) || msb(bb) !== naiveMsb(bb) || popcount(bb) !== naivePop(bb)) scanBad++;
}
assert(scanBad === 0, 'lsb/msb/popcount match naive over 4000 random boards');

for (let t = 0; t < 300; t++) {
  const occ = rnd() >> BigInt(t % 40);
  for (let sq = 0; sq < 64; sq += 5) {
    if (rookAttacks(sq, occ) !== naiveRay(sq, occ, RDIRS)) sliderBad++;
    if (bishopAttacks(sq, occ) !== naiveRay(sq, occ, BDIRS)) sliderBad++;
    if (queenAttacks(sq, occ) !== (naiveRay(sq, occ, RDIRS) | naiveRay(sq, occ, BDIRS))) sliderBad++;
  }
}
assert(sliderBad === 0, 'magic slider attacks match a ray walk');

let betweenBad = 0;
for (let a = 0; a < 64; a++) {
  for (let b = 0; b < 64; b++) {
    const expect = between(a, b);
    // Squares strictly between must be collinear with a,b and exclude both.
    if (expect & bit(a)) betweenBad++;
    if (expect & bit(b)) betweenBad++;
    if (popcount(expect) > 6) betweenBad++;
  }
}
assert(betweenBad === 0, 'between() excludes endpoints and stays on the line');

/* ---------------- fast legality agrees with make/undo ---------------- */

let positionsChecked = 0;
let movesChecked = 0;
let disagree = 0;
const diffPos = new Position();
function diffCheck() {
  positionsChecked++;
  for (const m of diffPos.genMoves(false)) {
    movesChecked++;
    if (diffPos.isLegal(m) !== diffPos.isLegalFast(m)) disagree++;
  }
  const filtered = diffPos.filterLegal(diffPos.genMoves(false));
  const manual = diffPos.genMoves(false).filter((m) => diffPos.isLegal(m));
  if (filtered.length !== manual.length) disagree++;
}

const LEGALITY_FENS = [
  'rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3',
  'rnbqkbnr/ppp1pppp/8/8/3pP3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 3',
  '8/8/8/2k1pP2/8/8/8/4K3 w - e6 0 1',
  'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
  'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R b KQkq - 0 1',
  'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
  'n1n5/PPPk4/8/8/8/8/4Kppp/5N1N b - - 0 1',
  '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1',
];
let rng = 987654321;
const rand = () => { rng = (Math.imul(rng, 1103515245) + 12345) & 0x7fffffff; return rng / 0x7fffffff; };

for (const fen of LEGALITY_FENS) {
  diffPos.setFen(fen);
  diffCheck();
  for (let ply = 0; ply < 20; ply++) {
    const legal = diffPos.genMoves(false).filter((m) => diffPos.isLegal(m));
    if (!legal.length) break;
    diffPos.makeMove(legal[(rand() * legal.length) | 0]);
    diffCheck();
  }
}
for (let g = 0; g < 60; g++) {
  diffPos.setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  for (let ply = 0; ply < 40; ply++) {
    const legal = diffPos.genMoves(false).filter((m) => diffPos.isLegal(m));
    if (!legal.length) break;
    diffCheck();
    diffPos.makeMove(legal[(rand() * legal.length) | 0]);
  }
}
assert(disagree === 0, `isLegalFast/filterLegal agree with isLegal over ${movesChecked} moves in ${positionsChecked} positions`);

/* ---------------- search only ever returns legal moves ---------------- */

const searcher = new Searcher();
searcher.useBook = false;
let illegalBest = 0;
for (const [name, fen, d] of [['cpw3', '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', 6], ['kiwipete', 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', 6]]) {
  const p = new Position();
  p.setFen(fen);
  const legalSet = new Set(p.legalMoves().map(moveToUci));
  const r = searcher.search(p, { depth: d, time: 5000 });
  if (!legalSet.has(moveToUci(r.move))) illegalBest++;
}
assert(illegalBest === 0, 'search returns a legal best move');

/* ---------------- Texel tuner actually reduces loss ---------------- */

const t = tune(DATASET, { epochs: 40, lr: 0.02 });
assert(t.after < t.before, `texel training reduces net loss (${t.before.toFixed(0)} -> ${t.after.toFixed(0)})`);

/* ---------------- Chess960 boundary (documents current behaviour) ---------------- */

let nonStandard = 0;
let castleable = 0;
for (let id = 0; id < 960; id++) {
  if (backRank960(id).indexOf('K') === 4) continue;
  const p = new Position();
  setup960(p, id);
  nonStandard++;
  if (p.legalMoves().some((m) => moveFlags(m) & MF_CASTLE)) castleable++;
}
assert(nonStandard > 500, `960 produces ${nonStandard} non-standard king placements`);
assert(castleable === 0, '960 castling is not implemented (setup only) — see README');

if (failed) { console.error(failed, 'failures'); process.exit(1); }
console.log('slow tests passed');
