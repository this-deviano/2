export function allocateTime({
  wtime = 0,
  btime = 0,
  winc = 0,
  binc = 0,
  movestogo = 0,
  movetime = 0,
  side = 0,
  ply = 0,
} = {}) {
  if (movetime > 0) return Math.max(10, movetime - 15);
  const remain = side === 0 ? wtime : btime;
  const inc = side === 0 ? winc : binc;
  if (!remain) return 1000;
  const mtg = movestogo > 0 ? movestogo : Math.max(12, 40 - (ply / 2 | 0));
  let t = remain / mtg + inc * 0.8;
  t = Math.min(t, remain * 0.2);
  t = Math.max(20, t - 20);
  return t | 0;
}
