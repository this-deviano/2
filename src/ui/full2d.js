import { sqName } from '../engine/const.js';
import { moveFrom, moveTo } from '../engine/position.js';

const G = ['♙', '♘', '♗', '♖', '♕', '♔', '♟', '♞', '♝', '♜', '♛', '♚'];

export function mountFull2d(root, pos, handlers = {}) {
  root.classList.add('full2d');
  function draw(selected = -1, legal = []) {
    root.innerHTML = '';
    const dest = new Set(legal.filter((m) => moveFrom(m) === selected).map(moveTo));
    for (let r = 7; r >= 0; r--) {
      for (let f = 0; f < 8; f++) {
        const sq = r * 8 + f;
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'c2 ' + ((f + r) % 2 ? 'l' : 'd');
        if (sq === selected) cell.classList.add('sel');
        if (dest.has(sq)) cell.classList.add('mv');
        const pc = pos.pieceOn(sq);
        cell.textContent = pc ? G[pc.type + (pc.color ? 6 : 0)] : '';
        cell.title = sqName(sq);
        cell.onclick = () => handlers.onSq && handlers.onSq(sq);
        root.appendChild(cell);
      }
    }
  }
  draw();
  return { draw };
}
