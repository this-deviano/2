import { Position, moveToUci } from './position.js';
import { START_FEN } from './const.js';
import { moveToSan, parseSan } from './san.js';

export function gameToPgn({
  moves,
  headers = {},
  startFen = START_FEN,
} = {}) {
  const h = {
    Event: headers.Event || 'Aurora Chess',
    Site: headers.Site || 'https://aurora',
    Date: headers.Date || new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
    Round: headers.Round || '-',
    White: headers.White || 'Player',
    Black: headers.Black || 'Aurora',
    Result: headers.Result || '*',
    ...headers,
  };
  let out = '';
  for (const [k, v] of Object.entries(h)) out += `[${k} "${v}"]\n`;
  out += '\n';
  const pos = new Position();
  pos.setFen(startFen);
  let ply = 0;
  for (const m of moves) {
    if (ply % 2 === 0) out += `${(ply / 2 | 0) + 1}. `;
    out += moveToSan(pos, m) + ' ';
    pos.makeMove(m);
    ply++;
  }
  out += h.Result;
  return out.trim() + '\n';
}

export function parsePgn(pgn) {
  const headers = {};
  const headerRe = /\[(\w+)\s+"([^"]*)"\]/g;
  let m;
  while ((m = headerRe.exec(pgn))) headers[m[1]] = m[2];
  let body = pgn.replace(/\[.*?\]/gs, ' ');
  body = body.replace(/\{[^}]*\}/g, ' ');
  body = body.replace(/;.*$/gm, ' ');
  body = body.replace(/\([^)]*\)/g, ' ');
  body = body.replace(/\d+\.(\.\.)?/g, ' ');
  body = body.replace(/\$\d+/g, ' ');
  const tokens = body.trim().split(/\s+/).filter(Boolean);
  const result = tokens.find((t) => ['1-0', '0-1', '1/2-1/2', '*'].includes(t)) || '*';
  const pos = new Position();
  const fen = headers.FEN || START_FEN;
  pos.setFen(fen);
  const moves = [];
  const uci = [];
  for (const t of tokens) {
    if (['1-0', '0-1', '1/2-1/2', '*'].includes(t)) break;
    const mv = parseSan(pos, t);
    if (!mv) break;
    moves.push(mv);
    uci.push(moveToUci(mv));
    pos.makeMove(mv);
  }
  return { headers, moves, uci, result, fen };
}
