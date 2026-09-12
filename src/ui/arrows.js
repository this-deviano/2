import * as THREE from 'three';

export class ArrowLayer {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
  }
  clear() {
    while (this.group.children.length) this.group.remove(this.group.children[0]);
  }
  add(from, to, color = 0xc9a227) {
    const a = new THREE.Vector3((from & 7) - 3.5, 0.35, 3.5 - (from >> 3));
    const b = new THREE.Vector3((to & 7) - 3.5, 0.35, 3.5 - (to >> 3));
    const dir = b.clone().sub(a);
    const len = dir.length();
    dir.normalize();
    const arrow = new THREE.ArrowHelper(dir, a, len, color, 0.35, 0.22);
    this.group.add(arrow);
  }
  fromPv(uciLine) {
    this.clear();
    if (!uciLine) return;
    const parts = uciLine.trim().split(/\s+/).slice(0, 5);
    let i = 0;
    for (const u of parts) {
      if (u.length < 4) continue;
      const from = (u.charCodeAt(0) - 97) + 8 * (u.charCodeAt(1) - 49);
      const to = (u.charCodeAt(2) - 97) + 8 * (u.charCodeAt(3) - 49);
      this.add(from, to, i === 0 ? 0xc9a227 : 0x3d8b7a);
      i++;
    }
  }
}
