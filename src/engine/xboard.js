import readline from 'node:readline';
import { Position, parseUci, moveToUci } from './position.js';
import { Searcher } from './search.js';
import { START_FEN } from './const.js';

/** CECP / XBoard protocol (subset). */
export function xboardLoop() {
  const pos = new Position();
  const searcher = new Searcher();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let proto = 1;
  rl.on('line', (line) => {
    const p = line.trim().split(/\s+/);
    const c = p[0];
    if (c === 'xboard') console.log('');
    else if (c === 'protover') { proto = +p[1]; console.log('feature myname="Aurora" san=0 ping=1 setboard=1 done=1'); }
    else if (c === 'new') pos.setFen(START_FEN);
    else if (c === 'setboard') pos.setFen(p.slice(1).join(' '));
    else if (c === 'force') { /* wait */ }
    else if (c === 'go') {
      const r = searcher.search(pos, { time: 800 });
      const u = moveToUci(r.move);
      pos.makeMove(r.move);
      console.log('move ' + u);
    } else if (c === 'ping') console.log('pong ' + p[1]);
    else if (c === 'quit') process.exit(0);
    else if (/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(c)) {
      const m = parseUci(pos, c);
      if (m) pos.makeMove(m);
    }
  });
}

const isMain = process.argv[1] && String(process.argv[1]).includes('xboard');
if (isMain) xboardLoop();
