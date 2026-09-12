export class EvalGraph {
  constructor(canvas) {
    this.canvas = canvas;
    this.pts = [0];
  }
  push(cp) {
    this.pts.push(Math.max(-800, Math.min(800, cp)));
    this.draw();
  }
  reset() {
    this.pts = [0];
    this.draw();
  }
  draw() {
    if (!this.canvas) return;
    const c = this.canvas;
    const g = c.getContext('2d');
    const w = c.width, h = c.height;
    g.fillStyle = '#12141c';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#2a2d38';
    g.beginPath();
    g.moveTo(0, h / 2);
    g.lineTo(w, h / 2);
    g.stroke();
    g.strokeStyle = '#c9a227';
    g.beginPath();
    this.pts.forEach((y, i) => {
      const x = (i / Math.max(1, this.pts.length - 1)) * w;
      const py = h / 2 - (y / 800) * (h / 2 - 4);
      if (i === 0) g.moveTo(x, py);
      else g.lineTo(x, py);
    });
    g.stroke();
  }
}
