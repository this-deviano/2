export function expectedScore(ra, rb) {
  return 1 / (1 + 10 ** ((rb - ra) / 400));
}

export function updateElo(ra, rb, scoreA, k = 16) {
  const ea = expectedScore(ra, rb);
  return {
    a: ra + k * (scoreA - ea),
    b: rb + k * ((1 - scoreA) - (1 - ea)),
  };
}

export function performanceRating(opp, score, games) {
  if (score <= 0) return opp - 800;
  if (score >= games) return opp + 800;
  const p = score / games;
  return opp - 400 * Math.log10(1 / p - 1);
}
