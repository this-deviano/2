const GLYPH = {
  '0-0': '♙', '0-1': '♘', '0-2': '♗', '0-3': '♖', '0-4': '♕', '0-5': '♔',
  '1-0': '♟', '1-1': '♞', '1-2': '♝', '1-3': '♜', '1-4': '♛', '1-5': '♚',
};

export function render2d(el, pos, { selected = -1, last = 0, flipped = false, onSq } = {}) {
  el.innerHTML = '';
  el.classList.add('board2d');
  for (let r = 7; r >= 0; r--) {
    for (let f = 0; f < 8; f++) {
      const sq = r * 8 + f;
      const vis = flipped ? 63 - sq : sq;
      const cell = document.createElement('div');
      const light = ((vis & 7) + (vis >> 3)) % 2 === 1;
      cell.className = 'sq ' + (light ? 'l' : 'd');
      if (vis === selected) cell.classList.add('sel');
      const pc = pos.pieceOn(vis);
      cell.textContent = pc ? GLYPH[`${pc.color}-${pc.type}`] : '';
      cell.dataset.sq = vis;
      cell.onclick = () => onSq && onSq(+vis);
      el.appendChild(cell);
    }
  }
}
