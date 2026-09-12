export class PremoveQueue {
  constructor() { this.q = []; }
  set(from, to, promo = '') {
    this.q = [{ from, to, promo }];
  }
  clear() { this.q = []; }
  peek() { return this.q[0] || null; }
  pop() { return this.q.shift() || null; }
}
