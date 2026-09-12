import { Position } from './position.js';
import { Searcher } from './search.js';
import { START_FEN } from './const.js';
import { moveToUci } from './position.js';

const FENS = [
  ['startpos', START_FEN],
  ['kiwipete', 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1'],
  ['pos3', '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1'],
  ['pos5', 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8'],
];

const searcher = new Searcher();
let nodes = 0;
let maxDepth = 0;
const t0 = Date.now();

for (const [name, fen] of FENS) {
  const pos = new Position();
  pos.setFen(fen);
  // Every line carries the position name: unlabelled `info` blocks for four
  // different FENs are easy to misread as one position's search.
  searcher.onInfo = (i) => {
    if (i.depth > maxDepth) maxDepth = i.depth;
    console.log(`${name} info depth ${i.depth} score cp ${i.score} nodes ${i.nodes} nps ${i.nps} time ${i.time} pv ${i.pv}`);
  };
  const r = searcher.search(pos, { time: 800, depth: 12 });
  nodes += r.nodes;
  console.log(`${name} bestmove ${moveToUci(r.move)} score ${r.score} fen ${fen}`);
}

const ms = Date.now() - t0;
console.log(`bench nodes ${nodes} time ${ms}ms nps ${Math.round(nodes / (ms / 1000))} maxDepth ${maxDepth}`);
