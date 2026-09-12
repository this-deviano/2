import readline from 'node:readline';
import { Position, parseUci, moveToUci } from './position.js';
import { Searcher, scoreToStr } from './search.js';
import { START_FEN } from './const.js';
import { evaluate } from './eval.js';

const pos = new Position();
const searcher = new Searcher();

searcher.onInfo = (i) => {
  console.log(`info depth ${i.depth} score ${scoreToStr(i.score)} nodes ${i.nodes} nps ${i.nps} time ${i.time} pv ${i.pv}${i.book ? ' string book' : ''}`);
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.on('line', (line) => {
  const parts = line.trim().split(/\s+/);
  const cmd = parts[0];
  if (cmd === 'uci') {
    console.log('id name Aurora 1.1');
    console.log('id author Arena');
    console.log('option name Hash type spin default 64 min 1 max 1024');
    console.log('option name OwnBook type check default true');
    console.log('option name Skill Level type spin default 20 min 0 max 20');
    console.log('option name MultiPV type spin default 1 min 1 max 8');
    console.log('option name UCI_Chess960 type check default false');
    console.log('uciok');
  } else if (cmd === 'isready') {
    console.log('readyok');
  } else if (cmd === 'ucinewgame') {
    searcher.clear();
    pos.setFen(START_FEN);
  } else if (cmd === 'setoption') {
    const name = parts[2];
    const value = parts[parts.length - 1];
    if (name === 'OwnBook') searcher.useBook = value === 'true';
  } else if (cmd === 'position') {
    let i = 1;
    if (parts[i] === 'startpos') {
      pos.setFen(START_FEN);
      i++;
    } else if (parts[i] === 'fen') {
      let j = i + 1;
      const fenParts = [];
      while (j < parts.length && parts[j] !== 'moves') {
        fenParts.push(parts[j]);
        j++;
      }
      pos.setFen(fenParts.join(' '));
      i = j;
    }
    if (parts[i] === 'moves') {
      for (const u of parts.slice(i + 1)) {
        const m = parseUci(pos, u);
        if (m) pos.makeMove(m);
      }
    }
  } else if (cmd === 'go') {
    let time = 1000, depth = 64, infinite = false;
    let wtime = 0, btime = 0, inc = 0, movestogo = 30;
    for (let i = 1; i < parts.length; i++) {
      if (parts[i] === 'wtime') wtime = +parts[i + 1];
      if (parts[i] === 'btime') btime = +parts[i + 1];
      if (parts[i] === 'winc' || parts[i] === 'binc') inc = +parts[i + 1];
      if (parts[i] === 'movestogo') movestogo = +parts[i + 1];
      if (parts[i] === 'movetime') time = +parts[i + 1];
      if (parts[i] === 'depth') depth = +parts[i + 1];
      if (parts[i] === 'infinite') infinite = true;
    }
    if (wtime || btime) {
      const remain = pos.side === 0 ? wtime : btime;
      time = Math.max(30, ((remain / Math.max(8, movestogo)) + inc * 0.8) | 0);
    }
    const r = searcher.search(pos, { time, depth, infinite });
    console.log(`bestmove ${r.move ? moveToUci(r.move) : '0000'}`);
  } else if (cmd === 'd') {
    console.log(pos.fen());
    console.log('eval', evaluate(pos));
  } else if (cmd === 'stop') {
    searcher.stop = true;
  } else if (cmd === 'quit') {
    process.exit(0);
  }
});
