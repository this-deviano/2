import { Position } from '../engine/position.js';
import { START_FEN } from '../engine/const.js';

const CYCLE = [null, { color: 0, type: 0 }, { color: 0, type: 1 }, { color: 0, type: 2 }, { color: 0, type: 3 }, { color: 0, type: 4 }, { color: 0, type: 5 }, { color: 1, type: 0 }, { color: 1, type: 1 }, { color: 1, type: 2 }, { color: 1, type: 3 }, { color: 1, type: 4 }, { color: 1, type: 5 }];

export function cycleSquare(pos, sq) {
  const cur = pos.pieceOn(sq);
  let idx = 0;
  if (cur) {
    idx = CYCLE.findIndex((p) => p && p.color === cur.color && p.type === cur.type);
  }
  const next = CYCLE[(idx + 1) % CYCLE.length];
  const fenRows = pos.fen().split(' ')[0].split('/');
  const map = [];
  for (let r = 7; r >= 0; r--) {
    const row = [];
    for (let f = 0; f < 8; f++) row.push(pos.pieceOn(r * 8 + f));
    map.push(row);
  }
  const r = sq >> 3;
  const f = sq & 7;
  map[7 - r][f] = next;
  const letters = ['PNBRQK', 'pnbrqk'];
  let body = '';
  for (let rr = 0; rr < 8; rr++) {
    let empty = 0;
    for (let ff = 0; ff < 8; ff++) {
      const pc = map[rr][ff];
      if (!pc) empty++;
      else {
        if (empty) { body += empty; empty = 0; }
        body += letters[pc.color][pc.type];
      }
    }
    if (empty) body += empty;
    if (rr < 7) body += '/';
  }
  const rest = pos.fen().split(' ').slice(1).join(' ');
  pos.setFen(`${body} ${rest}`);
}

export function emptyBoard() {
  const p = new Position();
  p.setFen('8/8/8/8/8/8/8/8 w - - 0 1');
  return p;
}

export { START_FEN };
