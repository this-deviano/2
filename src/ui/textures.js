import * as THREE from 'three';

export function woodTexture(light = '#d9c9a5', dark = '#6a4a2a') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = light;
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = dark + Math.floor(20 + Math.random() * 40).toString(16);
    g.globalAlpha = 0.08;
    g.beginPath();
    const y = Math.random() * 256;
    g.moveTo(0, y);
    g.bezierCurveTo(80, y + 8, 160, y - 8, 256, y);
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function feltTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#1a1510';
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 800; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
    g.fillRect(Math.random() * 128, Math.random() * 128, 1, 1);
  }
  return new THREE.CanvasTexture(c);
}
