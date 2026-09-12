import { Position, moveToUci, parseUci } from './position.js';
import { Searcher } from './search.js';
import { START_FEN } from './const.js';
import { gameToPgn } from './pgn.js';
import { moveToSan } from './san.js';

export function playGame({ time = 80, maxPly = 160, seedFen = START_FEN } = {}) {
  const pos = new Position();
  pos.setFen(seedFen);
  const w = new Searcher();
  const b = new Searcher();
  w.useBook = true;
  b.useBook = true;
  const moves = [];
  const uci = [];
  let result = '*';
  for (let ply = 0; ply < maxPly; ply++) {
    const legal = pos.legalMoves();
    if (!legal.length) {
      result = pos.inCheck() ? (pos.side === 0 ? '0-1' : '1-0') : '1/2-1/2';
      break;
    }
    if (pos.halfmove >= 100 || pos.isRepetition() || pos.insufficientMaterial()) {
      result = '1/2-1/2';
      break;
    }
    const engine = pos.side === 0 ? w : b;
    const r = engine.search(pos, { time, depth: 32, useBook: ply < 16 });
    if (!r.move) {
      result = '1/2-1/2';
      break;
    }
    moves.push(r.move);
    uci.push(moveToUci(r.move));
    pos.makeMove(r.move);
  }
  if (result === '*') result = '1/2-1/2';
  return { result, uci, pgn: gameToPgn({ moves, headers: { White: 'Aurora W', Black: 'Aurora B', Result: result } }) };
}

const isMain = process.argv[1] && process.argv[1].includes('selfplay');
if (isMain) {
  const n = +(process.argv[2] || 1);
  for (let i = 0; i < n; i++) {
    const g = playGame({ time: 50 });
    console.log(g.result, g.uci.slice(0, 12).join(' '));
  }
}
