import { execSync } from 'node:child_process';

function run(a) {
  return execSync(`node src/cli.js ${a}`, { encoding: 'utf8', cwd: new URL('..', import.meta.url).pathname.replace(/test\/$/, '') });
}

const cwd = process.cwd();
function sh(a) {
  return execSync(`node src/cli.js ${a}`, { encoding: 'utf8', cwd });
}

let failed = 0;
function assert(c, m) {
  if (!c) { failed++; console.error('FAIL', m); }
  else console.log('ok ', m);
}

const p = sh('perft 2');
assert(p.includes('400'), 'cli perft2');
const e = sh('eval');
assert(e.includes('hce'), 'cli eval');
const f = sh('fen-check rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
assert(f.includes('true') || f.includes('ok'), 'cli fen-check ' + f.slice(0, 80));
const n = sh('960 518');
assert(n.includes('rnbqkbnr'), 'cli 960');

if (failed) { console.error(failed, 'failures'); process.exit(1); }
console.log('cli tests passed');
