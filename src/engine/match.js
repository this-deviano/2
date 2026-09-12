import { playGame } from './selfplay.js';

export function match(games = 4, time = 40) {
  const tally = { '1-0': 0, '0-1': 0, '1/2-1/2': 0 };
  const pgns = [];
  for (let i = 0; i < games; i++) {
    const g = playGame({ time });
    tally[g.result] = (tally[g.result] || 0) + 1;
    pgns.push(g.pgn);
  }
  return { tally, pgns };
}

const isMain = process.argv[1] && String(process.argv[1]).includes('match');
if (isMain) {
  const r = match(+(process.argv[2] || 2), 40);
  console.log(r.tally);
}
