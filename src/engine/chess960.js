import { Position } from './position.js';

function place(arr, idx, ch) { arr[idx] = ch; }

/** Standard Chess960 / Fischer Random back-rank from id 0..959 */
export function backRank960(id) {
  id = ((id % 960) + 960) % 960;
  const p = Array(8).fill(null);
  const n = id;
  const lightBishop = [1, 3, 5, 7];
  const darkBishop = [0, 2, 4, 6];
  place(p, lightBishop[n % 4], 'B');
  let x = Math.floor(n / 4);
  place(p, darkBishop[x % 4], 'B');
  x = Math.floor(x / 4);
  const empties = () => p.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  place(p, empties()[x % 6], 'Q');
  x = Math.floor(x / 6);
  const n1 = x % 10;
  const knightTable = [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 2], [1, 3], [1, 4],
    [2, 3], [2, 4],
    [3, 4],
  ];
  const [a, b] = knightTable[n1];
  const e = empties();
  place(p, e[a], 'N');
  place(p, e[b], 'N');
  const rest = empties();
  place(p, rest[0], 'R');
  place(p, rest[1], 'K');
  place(p, rest[2], 'R');
  return p.join('');
}

export function chess960Fen(id) {
  const back = backRank960(id);
  const black = back.toLowerCase();
  return `${black}/pppppppp/8/8/8/8/PPPPPPPP/${back} w KQkq - 0 1`;
}

export function random960(rng = Math.random) {
  return chess960Fen((rng() * 960) | 0);
}

export function setup960(pos, id) {
  pos.setFen(chess960Fen(id));
  return pos;
}
