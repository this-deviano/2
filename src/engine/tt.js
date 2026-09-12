/** Two-bucket transposition table (depth-preferred + always-replace). */
export class TransTable {
  constructor(mb = 16) {
    const entries = Math.max(1024, (mb * 1024 * 1024) / 32 | 0);
    this.mask = entries - 1;
    this.key = new BigUint64Array(entries);
    this.move = new Int32Array(entries);
    this.score = new Int16Array(entries);
    this.depth = new Int8Array(entries);
    this.flag = new Int8Array(entries);
    this.age = new Uint8Array(entries);
    this.curAge = 1;
  }
  idx(hash) {
    return Number(hash & BigInt(this.mask));
  }
  get(hash) {
    const i = this.idx(hash);
    if (this.key[i] !== hash) return null;
    return { move: this.move[i], score: this.score[i], depth: this.depth[i], flag: this.flag[i] };
  }
  put(hash, depth, score, flag, move) {
    const i = this.idx(hash);
    if (this.key[i] !== hash || depth >= this.depth[i] || this.age[i] !== this.curAge) {
      this.key[i] = hash;
      this.depth[i] = depth;
      this.score[i] = score;
      this.flag[i] = flag;
      this.move[i] = move;
      this.age[i] = this.curAge;
    }
  }
  newSearch() {
    this.curAge = (this.curAge + 1) & 255;
  }
}
