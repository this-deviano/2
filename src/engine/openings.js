/** Named opening lines as UCI sequences. Probe by matching the game prefix. */
export const OPENING_LINES = [
  { eco: 'B20', name: 'Sicilian Defence', u: ['e2e4', 'c7c5'] },
  { eco: 'B90', name: 'Sicilian Najdorf', u: ['e2e4', 'c7c5', 'g1f3', 'd7d6', 'd2d4', 'c5d4', 'f3d4', 'g8f6', 'b1c3', 'a7a6'] },
  { eco: 'B33', name: 'Sicilian Sveshnikov', u: ['e2e4', 'c7c5', 'g1f3', 'b8c6', 'd2d4', 'c5d4', 'f3d4', 'g8f6', 'b1c3', 'e7e5'] },
  { eco: 'B70', name: 'Sicilian Dragon', u: ['e2e4', 'c7c5', 'g1f3', 'd7d6', 'd2d4', 'c5d4', 'f3d4', 'g8f6', 'b1c3', 'g7g6'] },
  { eco: 'B40', name: 'Sicilian Kan', u: ['e2e4', 'c7c5', 'g1f3', 'e7e6', 'd2d4', 'c5d4', 'f3d4', 'a7a6'] },
  { eco: 'B30', name: 'Sicilian Rossolimo', u: ['e2e4', 'c7c5', 'g1f3', 'b8c6', 'f1b5'] },
  { eco: 'C60', name: 'Ruy Lopez', u: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5'] },
  { eco: 'C65', name: 'Ruy Lopez Berlin', u: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'g8f6'] },
  { eco: 'C78', name: 'Ruy Lopez Morphy', u: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'a7a6', 'b5a4', 'g8f6'] },
  { eco: 'C89', name: 'Ruy Lopez Marshall', u: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'a7a6', 'b5a4', 'g8f6', 'e1g1', 'f8e7', 'f1e1', 'b7b5', 'a4b3', 'e8g8', 'c2c3', 'd7d5'] },
  { eco: 'C50', name: 'Italian Game', u: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4'] },
  { eco: 'C54', name: 'Giuoco Piano', u: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f8c5', 'c2c3', 'g8f6'] },
  { eco: 'C51', name: 'Evans Gambit', u: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f8c5', 'b2b4'] },
  { eco: 'C42', name: 'Petrov Defence', u: ['e2e4', 'e7e5', 'g1f3', 'g8f6'] },
  { eco: 'C45', name: 'Scotch Game', u: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'd2d4'] },
  { eco: 'C30', name: "King's Gambit", u: ['e2e4', 'e7e5', 'f2f4'] },
  { eco: 'C20', name: 'Open Game', u: ['e2e4', 'e7e5'] },
  { eco: 'C00', name: 'French Defence', u: ['e2e4', 'e7e6'] },
  { eco: 'C02', name: 'French Advance', u: ['e2e4', 'e7e6', 'd2d4', 'd7d5', 'e4e5'] },
  { eco: 'C11', name: 'French Steinitz', u: ['e2e4', 'e7e6', 'd2d4', 'd7d5', 'b1c3', 'g8f6'] },
  { eco: 'C15', name: 'French Winawer', u: ['e2e4', 'e7e6', 'd2d4', 'd7d5', 'b1c3', 'f8b4'] },
  { eco: 'C10', name: 'French Rubinstein', u: ['e2e4', 'e7e6', 'd2d4', 'd7d5', 'b1c3', 'd5e4'] },
  { eco: 'B10', name: 'Caro-Kann', u: ['e2e4', 'c7c6'] },
  { eco: 'B12', name: 'Caro-Kann Advance', u: ['e2e4', 'c7c6', 'd2d4', 'd7d5', 'e4e5'] },
  { eco: 'B18', name: 'Caro-Kann Classical', u: ['e2e4', 'c7c6', 'd2d4', 'd7d5', 'b1c3', 'd5e4', 'c3e4', 'c8f5'] },
  { eco: 'B01', name: 'Scandinavian', u: ['e2e4', 'd7d5'] },
  { eco: 'B02', name: 'Alekhine Defence', u: ['e2e4', 'g8f6'] },
  { eco: 'B06', name: 'Modern Defence', u: ['e2e4', 'g7g6'] },
  { eco: 'B07', name: 'Pirc Defence', u: ['e2e4', 'd7d6', 'd2d4', 'g8f6', 'b1c3', 'g7g6'] },
  { eco: 'A40', name: "Queen's Pawn", u: ['d2d4'] },
  { eco: 'D00', name: "Queen's Pawn Game", u: ['d2d4', 'd7d5'] },
  { eco: 'D06', name: "Queen's Gambit", u: ['d2d4', 'd7d5', 'c2c4'] },
  { eco: 'D30', name: 'QGD', u: ['d2d4', 'd7d5', 'c2c4', 'e7e6'] },
  { eco: 'D43', name: 'Semi-Slav', u: ['d2d4', 'd7d5', 'c2c4', 'c7c6', 'g1f3', 'g8f6', 'b1c3', 'e7e6'] },
  { eco: 'D10', name: 'Slav Defence', u: ['d2d4', 'd7d5', 'c2c4', 'c7c6'] },
  { eco: 'D80', name: 'Gruenfeld', u: ['d2d4', 'g8f6', 'c2c4', 'g7g6', 'b1c3', 'd7d5'] },
  { eco: 'E60', name: "King's Indian", u: ['d2d4', 'g8f6', 'c2c4', 'g7g6'] },
  { eco: 'E90', name: "King's Indian Classical", u: ['d2d4', 'g8f6', 'c2c4', 'g7g6', 'b1c3', 'f8g7', 'e2e4', 'd7d6', 'g1f3', 'e8g8', 'f1e2'] },
  { eco: 'E20', name: 'Nimzo-Indian', u: ['d2d4', 'g8f6', 'c2c4', 'e7e6', 'b1c3', 'f8b4'] },
  { eco: 'E00', name: "Queen's Indian / Catalan path", u: ['d2d4', 'g8f6', 'c2c4', 'e7e6'] },
  { eco: 'E12', name: "Queen's Indian", u: ['d2d4', 'g8f6', 'c2c4', 'e7e6', 'g1f3', 'b7b6'] },
  { eco: 'E01', name: 'Catalan', u: ['d2d4', 'g8f6', 'c2c4', 'e7e6', 'g2g3'] },
  { eco: 'A57', name: 'Benko Gambit', u: ['d2d4', 'g8f6', 'c2c4', 'c7c5', 'd4d5', 'b7b5'] },
  { eco: 'A56', name: 'Benoni', u: ['d2d4', 'g8f6', 'c2c4', 'c7c5'] },
  { eco: 'A80', name: 'Dutch Defence', u: ['d2d4', 'f7f5'] },
  { eco: 'D70', name: 'Neo-Gruenfeld', u: ['d2d4', 'g8f6', 'c2c4', 'g7g6', 'g2g3', 'd7d5'] },
  { eco: 'A10', name: 'English Opening', u: ['c2c4'] },
  { eco: 'A20', name: 'English, Reversed Sicilian', u: ['c2c4', 'e7e5'] },
  { eco: 'A30', name: 'English Symmetrical', u: ['c2c4', 'c7c5'] },
  { eco: 'A04', name: 'Reti Opening', u: ['g1f3'] },
  { eco: 'A07', name: "King's Indian Attack", u: ['g1f3', 'd7d5', 'g2g3'] },
  { eco: 'A00', name: 'Larsen Attack', u: ['b2b3'] },
  { eco: 'A00b', name: 'Bird Opening', u: ['f2f4'] },
  { eco: 'A00c', name: "Grob's Attack", u: ['g2g4'] },
  { eco: 'C44', name: 'Ponziani', u: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'c2c3'] },
  { eco: 'C46', name: 'Four Knights', u: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'b1c3', 'g8f6'] },
  { eco: 'C47', name: 'Four Knights Scotch', u: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'b1c3', 'g8f6', 'd2d4'] },
  { eco: 'C48', name: 'Four Knights Spanish', u: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'b1c3', 'g8f6', 'f1b5'] },
  { eco: 'C55', name: 'Two Knights', u: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6'] },
  { eco: 'C57', name: 'Two Knights Fried Liver', u: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6', 'f3g5', 'd7d5', 'e4d5', 'f6d5', 'g5f7'] },
  { eco: 'D02', name: 'London System', u: ['d2d4', 'd7d5', 'g1f3', 'g8f6', 'c1f4'] },
  { eco: 'D00j', name: 'Jobava London', u: ['d2d4', 'd7d5', 'b1c3', 'g8f6', 'c1f4'] },
  { eco: 'A45', name: 'Trompowsky', u: ['d2d4', 'g8f6', 'c1g5'] },
  { eco: 'A46', name: 'Torre Attack', u: ['d2d4', 'g8f6', 'g1f3', 'e7e6', 'c1g5'] },
  { eco: 'C23', name: "Bishop's Opening", u: ['e2e4', 'e7e5', 'f1c4'] },
  { eco: 'C25', name: 'Vienna Game', u: ['e2e4', 'e7e5', 'b1c3'] },
  { eco: 'C26', name: 'Vienna Falkbeer', u: ['e2e4', 'e7e5', 'b1c3', 'g8f6'] },
  { eco: 'A01', name: 'Nimzo-Larsen', u: ['b2b3', 'e7e5'] },
  { eco: 'B22', name: 'Sicilian Alapin', u: ['e2e4', 'c7c5', 'c2c3'] },
  { eco: 'B21', name: 'Sicilian Smith-Morra', u: ['e2e4', 'c7c5', 'd2d4', 'c5d4', 'c2c3'] },
  { eco: 'B23', name: 'Closed Sicilian', u: ['e2e4', 'c7c5', 'b1c3'] },
  { eco: 'C01', name: 'French Exchange', u: ['e2e4', 'e7e6', 'd2d4', 'd7d5', 'e4d5'] },
  { eco: 'C03', name: 'French Tarrasch', u: ['e2e4', 'e7e6', 'd2d4', 'd7d5', 'b1d2'] },
  { eco: 'D20', name: "Queen's Gambit Accepted", u: ['d2d4', 'd7d5', 'c2c4', 'd5c4'] },
  { eco: 'D08', name: 'Albin Countergambit', u: ['d2d4', 'd7d5', 'c2c4', 'e7e5'] },
  { eco: 'D07', name: "Chigorin's Defence", u: ['d2d4', 'd7d5', 'c2c4', 'b8c6'] },
  { eco: 'A52', name: 'Budapest Gambit', u: ['d2d4', 'g8f6', 'c2c4', 'e7e5'] },
  { eco: 'E11', name: 'Bogo-Indian', u: ['d2d4', 'g8f6', 'c2c4', 'e7e6', 'g1f3', 'f8b4'] },
  { eco: 'A41', name: 'Modern / Wade', u: ['d2d4', 'd7d6'] },
  { eco: 'A43', name: 'Old Benoni', u: ['d2d4', 'c7c5'] },
  { eco: 'C41', name: 'Philidor', u: ['e2e4', 'e7e5', 'g1f3', 'd7d6'] },
  { eco: 'C40', name: 'Latvian Gambit', u: ['e2e4', 'e7e5', 'g1f3', 'f7f5'] },
  { eco: 'C64', name: 'Ruy Lopez Classical', u: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'f8c5'] },
  { eco: 'C63', name: 'Ruy Lopez Schliemann', u: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'f7f5'] },
  { eco: 'C68', name: 'Ruy Lopez Exchange', u: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'a7a6', 'b5c6'] },
  { eco: 'B15', name: 'Caro-Kann Tartakower', u: ['e2e4', 'c7c6', 'd2d4', 'd7d5', 'b1c3', 'd5e4', 'c3e4', 'g8f6'] },
  { eco: 'A13', name: 'English Agincourt', u: ['c2c4', 'e7e6'] },
  { eco: 'A15', name: 'English Anglo-Indian', u: ['c2c4', 'g8f6'] },
  { eco: 'A16', name: 'English Anglo-Gruenfeld', u: ['c2c4', 'g8f6', 'b1c3', 'd7d5'] },
];

export function probeOpening(uciHistory, rng = Math.random) {
  const n = uciHistory.length;
  const hits = OPENING_LINES.filter((l) => {
    if (l.u.length <= n) return false;
    for (let i = 0; i < n; i++) if (l.u[i] !== uciHistory[i]) return false;
    return true;
  });
  if (!hits.length) return null;
  const next = hits[Math.floor(rng() * hits.length)].u[n];
  return next;
}

export function openingName(uciHistory) {
  let best = null;
  for (const l of OPENING_LINES) {
    if (l.u.length > uciHistory.length) continue;
    let ok = true;
    for (let i = 0; i < l.u.length; i++) if (l.u[i] !== uciHistory[i]) { ok = false; break; }
    if (ok && (!best || l.u.length > best.u.length)) best = l;
  }
  return best;
}
