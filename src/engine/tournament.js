import { playGame } from './selfplay.js';
import { updateElo } from './elo.js';

export function roundRobin({ games = 2, time = 40, players = 2 } = {}) {
  const elo = Array(players).fill(1500);
  const gamesOut = [];
  for (let a = 0; a < players; a++) {
    for (let b = 0; b < players; b++) {
      if (a === b) continue;
      for (let g = 0; g < games; g++) {
        const game = playGame({ time });
        gamesOut.push({ white: a, black: b, result: game.result, uci: game.uci });
        const score = game.result === '1-0' ? 1 : game.result === '0-1' ? 0 : 0.5;
        const u = updateElo(elo[a], elo[b], score);
        elo[a] = u.a;
        elo[b] = u.b;
      }
    }
  }
  return { elo, games: gamesOut };
}

const isMain = process.argv[1] && String(process.argv[1]).includes('tournament');
if (isMain) {
  const r = roundRobin({ games: 1, time: 30, players: 2 });
  console.log('elo', r.elo.map((x) => x.toFixed(1)));
  console.log('games', r.games.length);
}
