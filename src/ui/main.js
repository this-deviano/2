import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Position, parseUci, moveToUci, moveFrom, moveTo } from '../engine/position.js';
import { START_FEN, WHITE, BLACK, PAWN, sqName } from '../engine/const.js';
import { moveToSan, parseSan } from '../engine/san.js';
import { gameToPgn, parsePgn } from '../engine/pgn.js';
import { PUZZLES } from '../engine/puzzles.js';
import { openingName } from '../engine/openings.js';
import { random960 } from '../engine/chess960.js';
import { render2d } from './twod.js';
import { soundMove, soundCapture, soundCheck, soundEnd } from './audio.js';
import { ArrowLayer } from './arrows.js';
import { cycleSquare } from './editor.js';
import { LESSONS } from '../data/lessons.js';
import { EvalGraph } from './graph.js';
import { FAMOUS_GAMES } from '../db/games.js';
import { OpeningTrainer } from '../modes/trainer.js';
import { PuzzleRush } from '../modes/rush.js';
import { validateFen } from '../engine/fen.js';
import { woodTexture, feltTexture } from './textures.js';
import { Replay } from './replay.js';
import { squareControl } from '../engine/control.js';
import { gameResult } from '../rules/fide.js';
import { loadSettings, saveSettings, applySettings } from './settings.js';
import { t } from './i18n.js';
import { lerpPiece, burst } from './animate.js';
import { explore } from '../modes/explorer.js';
import { PremoveQueue } from '../modes/premove.js';
import { mountFull2d } from './full2d.js';
import { EXTRA_PUZZLES } from '../data/puzzles-extra.js';

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c0d12);
scene.fog = new THREE.Fog(0x0c0d12, 18, 42);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 12, 14);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.maxPolarAngle = Math.PI / 2.05;
controls.minDistance = 8;
controls.maxDistance = 28;

scene.add(new THREE.HemisphereLight(0xc9d6e8, 0x1a120c, 0.7));
const sun = new THREE.DirectionalLight(0xfff2d8, 1.35);
sun.position.set(8, 16, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);
scene.add(new THREE.DirectionalLight(0x4a6a88, 0.4).translateX(-10));

const boardGroup = new THREE.Group();
scene.add(boardGroup);

const THEMES = {
  walnut: [0xd9c9a5, 0x4a3a2a],
  ice: [0xe8eef5, 0x4a6278],
  emerald: [0xeee6c8, 0x2f5d50],
};

const wood = woodTexture();
const lightMat = new THREE.MeshStandardMaterial({ color: 0xd9c9a5, roughness: 0.55, map: wood });
const darkMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.62, map: wood });
const hlMat = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.4, emissive: 0x332200 });
const mvMat = new THREE.MeshStandardMaterial({ color: 0x3d8b7a, roughness: 0.4, emissive: 0x0a221c });
const lastMat = new THREE.MeshStandardMaterial({ color: 0x8a6a2a, roughness: 0.5, emissive: 0x221800 });

const squareMeshes = [];
const floor = new THREE.Mesh(
  new THREE.CylinderGeometry(9.2, 9.2, 0.45, 48),
  new THREE.MeshStandardMaterial({ color: 0x1a1510, roughness: 0.8 })
);
floor.position.y = -0.35;
floor.material = new THREE.MeshStandardMaterial({ color: 0x1a1510, roughness: 0.85, map: feltTexture() });
floor.receiveShadow = true;
scene.add(floor);

for (let r = 0; r < 8; r++) {
  for (let f = 0; f < 8; f++) {
    const light = (f + r) % 2 === 1;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.18, 1), light ? lightMat : darkMat);
    mesh.position.set(f - 3.5, 0, 3.5 - r);
    mesh.receiveShadow = true;
    mesh.userData = { sq: r * 8 + f, light };
    boardGroup.add(mesh);
    squareMeshes[r * 8 + f] = mesh;
  }
}
const frame = new THREE.Mesh(
  new THREE.BoxGeometry(8.6, 0.22, 8.6),
  new THREE.MeshStandardMaterial({ color: 0x2a2118, roughness: 0.5, metalness: 0.2 })
);
frame.position.y = -0.12;
scene.add(frame);

const coordGroup = new THREE.Group();
scene.add(coordGroup);
function rebuildCoords(on) {
  coordGroup.clear();
  if (!on) return;
  const mk = (t, x, z) => {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#c9a227';
    g.font = '28px serif';
    g.textAlign = 'center';
    g.fillText(t, 32, 40);
    const tex = new THREE.CanvasTexture(c);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sp.scale.set(0.45, 0.45, 1);
    sp.position.set(x, 0.2, z);
    coordGroup.add(sp);
  };
  for (let f = 0; f < 8; f++) mk('abcdefgh'[f], f - 3.5, 4.3);
  for (let r = 0; r < 8; r++) mk(String(r + 1), -4.3, 3.5 - r);
}

function ivory(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.12 });
}
const whiteMat = ivory(0xf3efe4);
const blackMat = ivory(0x1c1c22);

function lathe(pts, mat) {
  const v = pts.map(([x, y]) => new THREE.Vector2(x, y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(v, 24), mat);
  m.castShadow = true;
  return m;
}
function makePawn(mat) {
  const g = new THREE.Group();
  g.add(lathe([[0.28, 0], [0.32, 0.08], [0.18, 0.12], [0.14, 0.38], [0.2, 0.48], [0.12, 0.52]], mat));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 16), mat);
  head.position.y = 0.66;
  head.castShadow = true;
  g.add(head);
  return g;
}
function makeKnight(mat) {
  const g = new THREE.Group();
  g.add(lathe([[0.3, 0], [0.34, 0.1], [0.2, 0.16]], mat));
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.36), mat);
  body.position.set(0, 0.45, 0.02); body.castShadow = true; g.add(body);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.22), mat);
  neck.position.set(0, 0.72, 0.12); neck.rotation.x = -0.4; neck.castShadow = true; g.add(neck);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.28), mat);
  snout.position.set(0, 0.82, 0.28); snout.castShadow = true; g.add(snout);
  return g;
}
function makeBishop(mat) {
  const g = new THREE.Group();
  g.add(lathe([[0.3, 0], [0.34, 0.08], [0.16, 0.14], [0.18, 0.55], [0.1, 0.7], [0.16, 0.82], [0.04, 0.95]], mat));
  return g;
}
function makeRook(mat) {
  const g = new THREE.Group();
  g.add(lathe([[0.32, 0], [0.36, 0.1], [0.22, 0.14], [0.22, 0.55]], mat));
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 16), mat);
  top.position.y = 0.68; top.castShadow = true; g.add(top);
  for (let i = 0; i < 4; i++) {
    const mer = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.1), mat);
    const a = (i * Math.PI) / 2;
    mer.position.set(Math.cos(a) * 0.2, 0.82, Math.sin(a) * 0.2);
    mer.castShadow = true; g.add(mer);
  }
  return g;
}
function makeQueen(mat) {
  const g = new THREE.Group();
  g.add(lathe([[0.34, 0], [0.38, 0.1], [0.18, 0.16], [0.2, 0.7], [0.28, 0.88], [0.08, 0.95]], mat));
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), mat);
  ball.position.y = 1.05; ball.castShadow = true; g.add(ball);
  return g;
}
function makeKing(mat) {
  const g = new THREE.Group();
  g.add(lathe([[0.34, 0], [0.38, 0.1], [0.18, 0.16], [0.2, 0.72], [0.26, 0.9], [0.1, 0.98]], mat));
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.28, 0.07), mat);
  crossV.position.y = 1.16; crossV.castShadow = true; g.add(crossV);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.07, 0.07), mat);
  crossH.position.y = 1.18; g.add(crossH);
  return g;
}
const makers = [makePawn, makeKnight, makeBishop, makeRook, makeQueen, makeKing];
const GLYPH = ['♙','♘','♗','♖','♕','♔','♟','♞','♝','♜','♛','♚'];

const pos = new Position();
let pieceMeshes = [];
let selected = -1;
let legal = [];
let lastMove = 0;
let thinking = false;
let humanMode = 0;
let flipped = false;
let pendingPromo = null;
let gameMoves = [];
let clocks = [180000, 180000];
let clockOn = true;
let lastTick = 0;
let over = false;
let analyze = false;

const worker = new Worker(new URL('../engine/worker.js', import.meta.url), { type: 'module' });
const arrows = new ArrowLayer(scene);
let editMode = false;
const graph = new EvalGraph(document.getElementById('evalGraph'));
let trainer = null;
let rush = null;
const premover = new PremoveQueue();
let lang = 'en';
let dragging = null;
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.1);
const full2dApi = mountFull2d(document.getElementById('full2dRoot') || document.createElement('div'), pos, {
  onSq: (sq) => {
    if (selected >= 0 && tryMove(selected, sq)) return;
    const pc = pos.pieceOn(sq);
    if (pc && pc.color === pos.side) {
      selected = sq;
      legal = pos.legalMoves().filter((m) => moveFrom(m) === sq);
      highlight();
    }
  },
});

function sqToWorld(sq) {
  return new THREE.Vector3((sq & 7) - 3.5, 0.1, 3.5 - (sq >> 3));
}

function refresh2d() {
  const el = document.getElementById('board2d');
  if (!el) return;
  el.style.display = document.getElementById('show2d')?.checked === false ? 'none' : 'grid';
  render2d(el, pos, {
    selected,
    last: lastMove,
    flipped,
    onSq: (sq) => {
      if (editMode) {
        cycleSquare(pos, sq);
        rebuildPieces();
        highlight();
        return;
      }
      if (thinking || over) return;
      if (selected >= 0 && tryMove(selected, sq)) return;
      const pc = pos.pieceOn(sq);
      if (pc && pc.color === pos.side) {
        selected = sq;
        legal = pos.legalMoves().filter((m) => moveFrom(m) === sq);
        highlight();
        refresh2d();
      }
    },
  });
}

function refreshOpening() {
  const uci = gameMoves.map((m) => moveToUci(m));
  const o = openingName(uci);
  const el = document.getElementById('openingName');
  if (el) el.textContent = o ? `Opening: ${o.eco} ${o.name}` : 'Opening: —';
}

function rebuildPieces() {
  for (const m of pieceMeshes) boardGroup.remove(m);
  pieceMeshes = [];
  for (let c = 0; c < 2; c++) {
    for (let p = 0; p < 6; p++) {
      let bb = pos.bb[c][p];
      while (bb) {
        const sq = Number(bb.toString(2).length - 1);
        bb ^= 1n << BigInt(sq);
        const mesh = makers[p](c === WHITE ? whiteMat : blackMat);
        mesh.position.copy(sqToWorld(sq));
        mesh.userData = { sq, color: c, type: p };
        if (c === BLACK) mesh.rotation.y = Math.PI;
        boardGroup.add(mesh);
        pieceMeshes.push(mesh);
      }
    }
  }
  updateCaps();
  refresh2d();
  refreshOpening();
  const ex = document.getElementById('explorer');
  if (ex) {
    const rows = explore(gameMoves.map((m) => moveToUci(m)));
    ex.textContent = rows.slice(0, 4).map((r) => `${r.uci} ×${r.count}`).join(' · ') || 'out of book';
  }
  full2dApi.draw(selected, legal);
}

function updateCaps() {
  const start = [8, 2, 2, 2, 1, 1];
  const have = (c, p) => {
    let n = 0, bb = pos.bb[c][p];
    while (bb) { n++; bb &= bb - 1n; }
    return n;
  };
  let w = '', b = '';
  for (let p = 5; p >= 0; p--) {
    const missW = start[p] - have(WHITE, p);
    const missB = start[p] - have(BLACK, p);
    w += GLYPH[p].repeat(Math.max(0, missW));
    b += GLYPH[p + 6].repeat(Math.max(0, missB));
  }
  document.getElementById('capW').textContent = w;
  document.getElementById('capB').textContent = b;
}

function clearHighlights() {
  for (const m of squareMeshes) m.material = m.userData.light ? lightMat : darkMat;
  if (lastMove) {
    squareMeshes[moveFrom(lastMove)].material = lastMat;
    squareMeshes[moveTo(lastMove)].material = lastMat;
  }
}
function highlight() {
  clearHighlights();
  if (selected >= 0) squareMeshes[selected].material = hlMat;
  for (const m of legal) if (moveFrom(m) === selected) squareMeshes[moveTo(m)].material = mvMat;
}

function resize() {
  const w = canvas.clientWidth || window.innerWidth - 320;
  const h = canvas.clientHeight || window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();
rebuildCoords(true);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
function pickSquare(ev) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(squareMeshes);
  if (hits.length) return hits[0].object.userData.sq;
  const ph = raycaster.intersectObjects(pieceMeshes, true);
  if (ph.length) {
    let o = ph[0].object;
    while (o && o.userData.sq == null) o = o.parent;
    return o?.userData.sq ?? -1;
  }
  return -1;
}

function setStatus(t) { document.getElementById('status').textContent = t; }
function fmt(ms) {
  if (!clockOn) return '—';
  const s = Math.max(0, ms / 1000);
  const m = s / 60 | 0;
  const sec = (s % 60).toFixed(1).padStart(4, '0');
  return `${m}:${sec}`;
}
function refreshClocks() {
  document.getElementById('clkW').classList.toggle('active', pos.side === WHITE && !over);
  document.getElementById('clkB').classList.toggle('active', pos.side === BLACK && !over);
  document.getElementById('timeW').textContent = fmt(clocks[0]);
  document.getElementById('timeB').textContent = fmt(clocks[1]);
}

function addMoveLog(san) {
  const ol = document.getElementById('moves');
  const ply = gameMoves.length;
  if (ply % 2 === 1) {
    const li = document.createElement('li');
    li.textContent = san;
    li.dataset.ply = String(gameMoves.length);
    li.onclick = () => {
      const uci = gameMoves.map((m) => moveToUci(m));
      const rep = new Replay(uci);
      pos.setFen(rep.to(+li.dataset.ply));
      rebuildPieces();
      highlight();
    };
    ol.appendChild(li);
  } else if (ol.lastElementChild) {
    ol.lastElementChild.textContent += '  ' + san;
  }
  ol.scrollTop = ol.scrollHeight;
}

function gameOverText() {
  const moves = pos.legalMoves();
  if (!moves.length) {
    if (pos.inCheck()) return (pos.side === WHITE ? 'Black' : 'White') + ' wins by checkmate';
    return 'Draw — stalemate';
  }
  if (pos.halfmove >= 100) return 'Draw — 50-move';
  if (pos.isRepetition()) return 'Draw — repetition';
  if (pos.insufficientMaterial()) return 'Draw — insufficient';
  return null;
}

function isHumanTurn() {
  if (over || analyze) return true;
  if (humanMode === 2) return true;
  if (humanMode === 3) return false;
  return pos.side === humanMode;
}

function afterMove(m, san) {
  lastMove = m;
  gameMoves.push(m);
  addMoveLog(san);
  const rp = document.getElementById('replay');
  if (rp) { rp.max = String(gameMoves.length); rp.value = String(gameMoves.length); }
  rebuildPieces();
  selected = -1;
  legal = [];
  highlight();
  refreshClocks();
  if (document.getElementById('sound')?.checked) {
    const cap = pos.history.at(-1)?.captured;
    if (cap) { soundCapture(); burst(scene, sqToWorld(moveTo(m))); }
    else soundMove();
    if (pos.inCheck()) soundCheck();
  }
  const g = gameOverText();
  if (g) {
    over = true;
    setStatus(g);
    thinking = false;
    if (document.getElementById('sound')?.checked) soundEnd();
    return;
  }
  setStatus((pos.side === WHITE ? t(lang, 'wtm') : t(lang, 'btm')) + (pos.inCheck() ? ' ' + t(lang, 'check') : ''));
  const pm = premover.pop();
  if (pm && isHumanTurn()) {
    tryMove(pm.from, pm.to, pm.promo);
    return;
  }
  if (!isHumanTurn()) engineMove();
}

function doUci(uci) {
  const m = parseUci(pos, uci);
  if (!m) return false;
  const san = moveToSan(pos, m);
  pos.makeMove(m);
  afterMove(m, san);
  return true;
}

function tryMove(from, to, promo) {
  const pc = pos.pieceOn(from);
  if (pc && pc.type === PAWN && ((to >> 3) === 0 || (to >> 3) === 7) && !promo) {
    pendingPromo = { from, to };
    document.getElementById('promo').hidden = false;
    return true;
  }
  return doUci(sqName(from) + sqName(to) + (promo || ''));
}

canvas.addEventListener('pointerdown', (ev) => {
  if (over) return;
  const sq = pickSquare(ev);
  if (sq < 0) return;
  if (!isHumanTurn() && !analyze) {
    if (selected >= 0) premover.set(selected, sq);
    const pc = pos.pieceOn(sq);
    if (pc && pc.color === humanMode) {
      selected = sq;
      highlight();
    }
    return;
  }
  if (thinking) return;
  if (selected >= 0) {
    if (tryMove(selected, sq)) return;
  }
  const pc = pos.pieceOn(sq);
  if (pc && pc.color === pos.side) {
    selected = sq;
    legal = pos.legalMoves().filter((m) => moveFrom(m) === sq);
    highlight();
    const mesh = pieceMeshes.find((p) => p.userData.sq === sq);
    dragging = mesh || null;
  } else {
    selected = -1; legal = []; highlight();
  }
});
canvas.addEventListener('pointermove', (ev) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = new THREE.Vector3();
  raycaster.ray.intersectPlane(dragPlane, hit);
  if (hit) dragging.position.set(hit.x, 0.4, hit.z);
});
canvas.addEventListener('pointerup', (ev) => {
  if (!dragging) return;
  const sq = pickSquare(ev);
  const from = dragging.userData.sq;
  dragging = null;
  if (sq >= 0 && sq !== from) tryMove(from, sq);
  else rebuildPieces();
});

document.getElementById('promo').onclick = (e) => {
  const p = e.target.dataset.p;
  if (!p || !pendingPromo) return;
  document.getElementById('promo').hidden = true;
  tryMove(pendingPromo.from, pendingPromo.to, p);
  pendingPromo = null;
};

function engineMove() {
  thinking = true;
  setStatus('Aurora is thinking…');
  worker.postMessage({ type: 'position', fen: pos.fen() });
  worker.postMessage({
    type: 'go',
    time: +document.getElementById('strength').value,
    useBook: document.getElementById('useBook').checked && !analyze,
  });
}

worker.onmessage = (e) => {
  const d = e.data;
  if (d.type === 'info') {
    document.getElementById('engineLine').textContent =
      `${d.book ? 'book' : 'd' + d.depth}  ${d.scoreStr || ''}  ${d.pv || ''}  ${d.nps || 0} nps`;
    if (d.pv) arrows.fromPv(d.pv);
    const cp = d.score || 0;
    const t = 1 / (1 + Math.exp(-cp / 280));
    document.getElementById('evalFill').style.width = `${(pos.side === WHITE ? t : 1 - t) * 100}%`;
  }
  if (d.type === 'bestmove') {
    thinking = false;
    if (typeof d.score === 'number') graph.push(d.score);
    if (analyze) return;
    if (d.uci) doUci(d.uci);
  }
};

function resetGame(fen = START_FEN) {
  pos.setFen(fen);
  gameMoves = [];
  lastMove = 0;
  over = false;
  thinking = false;
  document.getElementById('moves').innerHTML = '';
  graph.reset();
  const mins = +document.getElementById('clockMin').value;
  clockOn = mins > 0;
  clocks = [mins * 60000, mins * 60000];
  lastTick = performance.now();
  humanMode = +document.getElementById('humanSide').value;
  rebuildPieces();
  highlight();
  refreshClocks();
  setStatus('White to move');
  if (!isHumanTurn()) engineMove();
}

document.getElementById('newGame').onclick = () => resetGame();
document.getElementById('flip').onclick = () => {
  flipped = !flipped;
  camera.position.set(0, 12, flipped ? -14 : 14);
};
document.getElementById('undo').onclick = () => {
  if (thinking) return;
  pos.undoMove();
  gameMoves.pop();
  if (!isHumanTurn() && pos.history.length) {
    pos.undoMove();
    gameMoves.pop();
  }
  over = false;
  rebuildPieces();
  refreshClocks();
  setStatus((pos.side === WHITE ? 'White' : 'Black') + ' to move');
};
document.getElementById('hint').onclick = () => {
  worker.postMessage({ type: 'position', fen: pos.fen() });
  worker.postMessage({ type: 'go', time: 400, useBook: false });
  analyze = true;
  setTimeout(() => { analyze = false; }, 600);
};

document.getElementById('loadFen').onclick = () => {
  const f = document.getElementById('fenBox').value.trim();
  if (!f) return;
  const v = validateFen(f);
  if (!v.ok) { setStatus(v.errors[0]); return; }
  resetGame(f);
};
document.getElementById('copyFen').onclick = () => navigator.clipboard.writeText(pos.fen());
document.getElementById('copyPgn').onclick = () => {
  const pgn = gameToPgn({ moves: gameMoves, headers: { White: 'Player', Black: 'Aurora' } });
  navigator.clipboard.writeText(pgn);
};
document.getElementById('loadPgn').onclick = () => {
  const g = parsePgn(document.getElementById('pgnBox').value);
  resetGame(g.fen);
  for (const u of g.uci) doUci(u);
};
document.getElementById('analyzeGo').onclick = () => {
  analyze = true;
  thinking = true;
  worker.postMessage({ type: 'position', fen: pos.fen() });
  worker.postMessage({ type: 'go', time: 8000, useBook: false });
};
document.getElementById('analyzeStop').onclick = () => {
  worker.postMessage({ type: 'stop' });
  analyze = false;
  thinking = false;
};

const sel = document.getElementById('puzzleSel');
for (const p of [...PUZZLES, ...EXTRA_PUZZLES]) {
  const o = document.createElement('option');
  o.value = p.id; o.textContent = p.title;
  sel.appendChild(o);
}
document.getElementById('loadPuzzle').onclick = () => {
  const p = [...PUZZLES, ...EXTRA_PUZZLES].find((x) => x.id === sel.value);
  document.getElementById('puzzleTitle').textContent = p.goal;
  humanMode = 2;
  resetGame(p.fen);
};

document.querySelectorAll('.tabs button').forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll('.tabs button').forEach((x) => x.classList.remove('on'));
    b.classList.add('on');
    document.querySelectorAll('[data-pane]').forEach((p) => {
      p.hidden = p.dataset.pane !== b.dataset.tab;
    });
  };
});

document.getElementById('theme').onchange = (e) => {
  const [l, d] = THEMES[e.target.value];
  lightMat.color.setHex(l);
  darkMat.color.setHex(d);
};
document.getElementById('coords').onchange = (e) => rebuildCoords(e.target.checked);
document.getElementById('show2d')?.addEventListener('change', refresh2d);

document.getElementById('saveGame').onclick = () => {
  localStorage.setItem('aurora-game', JSON.stringify({ fen: START_FEN, pgn: gameToPgn({ moves: gameMoves }) }));
  setStatus('Game saved');
};
document.getElementById('loadGame').onclick = () => {
  const raw = localStorage.getItem('aurora-game');
  if (!raw) return;
  const g = parsePgn(JSON.parse(raw).pgn);
  resetGame(g.fen);
  for (const u of g.uci) doUci(u);
};
document.getElementById('frc').onclick = () => resetGame(random960());
document.getElementById('resign').onclick = () => {
  over = true;
  setStatus((pos.side === WHITE ? 'White' : 'Black') + ' resigns');
};

const ls = document.getElementById('lessonSel');
if (ls) {
  for (const L of LESSONS) {
    const o = document.createElement('option');
    o.value = L.id; o.textContent = L.title;
    ls.appendChild(o);
  }
}
document.getElementById('loadLesson')?.addEventListener('click', () => {
  const L = LESSONS.find((x) => x.id === ls.value);
  document.getElementById('lessonText').textContent = L.text;
  humanMode = 2;
  resetGame(L.fen);
});
document.getElementById('edEmpty')?.addEventListener('click', () => { editMode = true; resetGame('8/8/8/8/8/8/8/8 w - - 0 1'); });
document.getElementById('edStart')?.addEventListener('click', () => { editMode = true; resetGame(); });
document.getElementById('edPlay')?.addEventListener('click', () => { editMode = false; resetGame(pos.fen()); });

const gs = document.getElementById('gameSel');
if (gs) {
  for (const g of FAMOUS_GAMES) {
    const o = document.createElement('option');
    o.value = g.id;
    o.textContent = `${g.white}–${g.black} (${g.year})`;
    gs.appendChild(o);
  }
}
document.getElementById('loadGameDb')?.addEventListener('click', () => {
  const g = FAMOUS_GAMES.find((x) => x.id === gs.value);
  const parsed = parsePgn(g.pgn);
  humanMode = 2;
  resetGame(parsed.fen);
  for (const u of parsed.uci) doUci(u);
});
document.getElementById('trainNew')?.addEventListener('click', () => {
  trainer = new OpeningTrainer();
  humanMode = 2;
  resetGame();
  document.getElementById('trainHint').textContent = `Play ${trainer.line.eco} ${trainer.line.name}`;
});
document.getElementById('trainHintBtn')?.addEventListener('click', () => {
  if (trainer) setStatus('Hint: ' + trainer.hint());
});
document.getElementById('rushStart')?.addEventListener('click', () => {
  rush = new PuzzleRush();
  humanMode = 2;
  if (rush.current) resetGame(rush.current.fen);
  document.getElementById('rushScore').textContent = '0';
});
document.getElementById('replay')?.addEventListener('input', (e) => {
  const uci = gameMoves.map((m) => moveToUci(m));
  const rep = new Replay(uci);
  pos.setFen(rep.to(+e.target.value));
  rebuildPieces();
  highlight();
});

window.addEventListener('keydown', (e) => {
  if (e.target.matches('textarea, input, select')) return;
  const k = e.key.toLowerCase();
  if (k === 'n') resetGame();
  if (k === 'u') document.getElementById('undo').click();
  if (k === 'f') document.getElementById('flip').click();
  if (k === 'h') document.getElementById('hint').click();
  if (k === ' ') { e.preventDefault(); if (!thinking) engineMove(); }
});

rebuildPieces();
refreshClocks();
lastTick = performance.now();

function tick(now) {
  requestAnimationFrame(tick);
  if (clockOn && !over && !thinking && gameMoves.length) {
    const dt = now - lastTick;
    clocks[pos.side] -= dt;
    if (clocks[pos.side] <= 0) {
      clocks[pos.side] = 0;
      over = true;
      setStatus((pos.side === WHITE ? 'Black' : 'White') + ' wins on time');
    }
    if ((now / 100 | 0) !== (lastTick / 100 | 0)) refreshClocks();
  }
  lastTick = now;
  controls.update();
  renderer.render(scene, camera);
}
requestAnimationFrame(tick);
