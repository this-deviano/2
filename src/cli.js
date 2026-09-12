#!/usr/bin/env node
import { Position, parseUci, moveToUci } from './engine/position.js';
import { START_FEN } from './engine/const.js';
import { perft } from './engine/perft.js';
import { divide } from './engine/divide.js';
import { Searcher, scoreToStr } from './engine/search.js';
import { evaluate } from './engine/eval.js';
import { validateFen } from './engine/fen.js';
import { chess960Fen } from './engine/chess960.js';
import { openingName } from './engine/openings.js';
import { probeTb } from './engine/tb.js';
import { nnueEval } from './engine/nnue.js';

const args = process.argv.slice(2);
const cmd = args[0] || 'help';

function help() {
  console.log(`Aurora CLI
  perft [depth] [fen]
  divide [depth] [fen]
  eval [fen]
  go [--time ms] [--depth d] [fen]
  fen-check <fen>
  960 [id]
  bench
`);
}

if (cmd === 'help' || cmd === '-h') help();
else if (cmd === 'perft') {
  const d = +(args[1] || 4);
  const fen = args.slice(2).join(' ') || START_FEN;
  const p = new Position(); p.setFen(fen);
  const t0 = Date.now();
  const n = perft(p, d);
  console.log(`perft(${d}) = ${n} in ${Date.now() - t0}ms`);
} else if (cmd === 'divide') {
  const d = +(args[1] || 2);
  const p = new Position();
  if (args[2]) p.setFen(args.slice(2).join(' '));
  const { rows, total } = divide(p, d);
  for (const r of rows) console.log(r.uci, r.nodes);
  console.log('total', total);
} else if (cmd === 'eval') {
  const p = new Position();
  if (args[1]) p.setFen(args.slice(1).join(' '));
  console.log('hce', evaluate(p), 'nnue', nnueEval(p), 'tb', probeTb(p));
} else if (cmd === 'go') {
  let time = 400, depth = 64, fen = START_FEN;
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--time') time = +args[++i];
    else if (args[i] === '--depth') depth = +args[++i];
    else { fen = args.slice(i).join(' '); break; }
  }
  const p = new Position(); p.setFen(fen);
  const s = new Searcher();
  s.onInfo = (i) => console.log(`info depth ${i.depth} score ${scoreToStr(i.score)} nodes ${i.nodes} pv ${i.pv}`);
  const r = s.search(p, { time, depth });
  console.log('bestmove', r.move ? moveToUci(r.move) : '0000');
} else if (cmd === 'fen-check') {
  console.log(validateFen(args.slice(1).join(' ')));
} else if (cmd === '960') {
  console.log(chess960Fen(+(args[1] || 518)));
} else if (cmd === 'opening') {
  console.log(openingName(args.slice(1)) || 'unknown');
} else help();
