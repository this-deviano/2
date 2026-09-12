import * as THREE from 'three';

export function lerpPiece(mesh, to, ms = 180) {
  if (!mesh) return;
  const from = mesh.position.clone();
  const t0 = performance.now();
  function step(now) {
    const u = Math.min(1, (now - t0) / ms);
    const e = 1 - (1 - u) * (1 - u);
    mesh.position.lerpVectors(from, to, e);
    mesh.position.y = to.y + Math.sin(e * Math.PI) * 0.35;
    if (u < 1) requestAnimationFrame(step);
    else mesh.position.copy(to);
  }
  requestAnimationFrame(step);
}

export function burst(scene, at) {
  const g = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xc9a227 })
    );
    m.position.copy(at);
    m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 0.2, Math.random() * 0.15, (Math.random() - 0.5) * 0.2);
    g.add(m);
  }
  scene.add(g);
  const t0 = performance.now();
  function step(now) {
    const dt = (now - t0) / 400;
    for (const c of g.children) {
      c.position.add(c.userData.v);
      c.userData.v.y -= 0.01;
    }
    if (dt < 1) requestAnimationFrame(step);
    else scene.remove(g);
  }
  requestAnimationFrame(step);
}
