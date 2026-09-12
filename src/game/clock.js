export class DualClock {
  constructor(ms = 180000, inc = 0) {
    this.ms = [ms, ms];
    this.inc = inc;
    this.running = false;
    this.side = 0;
    this.last = 0;
  }
  start(side, now = performance.now()) {
    this.side = side;
    this.last = now;
    this.running = true;
  }
  tick(now = performance.now()) {
    if (!this.running) return this.ms[this.side];
    this.ms[this.side] -= now - this.last;
    this.last = now;
    if (this.ms[this.side] < 0) this.ms[this.side] = 0;
    return this.ms[this.side];
  }
  hit(side, now = performance.now()) {
    this.tick(now);
    this.ms[side] += this.inc;
    this.side = side ^ 1;
    this.last = now;
  }
  flag(side) {
    return this.ms[side] <= 0;
  }
}
