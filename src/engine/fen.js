const PIECE = /[pnbrqkPNBRQK]/;

export function validateFen(fen) {
  const errors = [];
  const p = fen.trim().split(/\s+/);
  if (p.length < 4) errors.push('FEN needs at least 4 fields');
  const rows = (p[0] || '').split('/');
  if (rows.length !== 8) errors.push('need 8 ranks');
  let wk = 0, bk = 0, squares = 0;
  for (const row of rows) {
    let w = 0;
    for (const ch of row) {
      if (ch >= '1' && ch <= '8') w += +ch;
      else if (PIECE.test(ch)) {
        w++;
        if (ch === 'K') wk++;
        if (ch === 'k') bk++;
      } else errors.push(`bad char ${ch}`);
    }
    if (w !== 8) errors.push('rank does not sum to 8');
    squares += w;
  }
  if (wk !== 1) errors.push('need one white king');
  if (bk !== 1) errors.push('need one black king');
  if (p[1] && p[1] !== 'w' && p[1] !== 'b') errors.push('side must be w or b');
  if (p[2] && !/^(K?Q?k?q?|-)$/.test(p[2])) errors.push('bad castling');
  if (p[3] && !/^(-|[a-h][36])$/.test(p[3])) errors.push('bad en passant');
  return { ok: errors.length === 0, errors };
}

export function normalizeFen(fen) {
  const p = fen.trim().split(/\s+/);
  while (p.length < 6) p.push(p.length === 4 ? '0' : '1');
  return p.slice(0, 6).join(' ');
}
