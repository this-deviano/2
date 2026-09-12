import { Position, parseUci, moveToUci } from './position.js';
import { Searcher, scoreToStr } from './search.js';
import { START_FEN } from './const.js';
import { evaluate } from './eval.js';
import { moveToSan } from './san.js';

const pos = new Position();
const searcher = new Searcher();

searcher.onInfo = (i) => {
  postMessage({ type: 'info', ...i, scoreStr: scoreToStr(i.score) });
};

onmessage = (e) => {
  const { type } = e.data;
  if (type === 'new') {
    pos.setFen(START_FEN);
    searcher.clear();
    postMessage({ type: 'ready', fen: pos.fen() });
  } else if (type === 'position') {
    pos.setFen(e.data.fen);
  } else if (type === 'move') {
    const m = parseUci(pos, e.data.uci);
    if (m) pos.makeMove(m);
    postMessage({ type: 'pos', fen: pos.fen() });
  } else if (type === 'go') {
    const r = searcher.search(pos, {
      time: e.data.time || 800,
      depth: e.data.depth || 64,
      useBook: e.data.useBook !== false,
    });
    const san = r.move ? moveToSan(pos, r.move) : null;
    postMessage({
      type: 'bestmove',
      uci: r.move ? moveToUci(r.move) : null,
      san,
      score: r.score,
      nodes: r.nodes,
      pv: r.pv,
      book: !!r.book,
    });
  } else if (type === 'eval') {
    postMessage({ type: 'eval', score: evaluate(pos) });
  } else if (type === 'stop') {
    searcher.stop = true;
  }
};
