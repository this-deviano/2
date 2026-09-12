const KEY = 'aurora-settings-v1';
const DEFAULTS = {
  theme: 'walnut',
  sound: true,
  coords: true,
  show2d: true,
  full2d: false,
  animate: true,
  skill: 20,
  strength: 800,
  clockMin: 3,
  book: true,
  language: 'en',
};

export function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function applySettings(s) {
  const set = (id, fn) => { const el = document.getElementById(id); if (el) fn(el); };
  set('theme', (el) => { el.value = s.theme; el.dispatchEvent(new Event('change')); });
  set('sound', (el) => { el.checked = s.sound; });
  set('coords', (el) => { el.checked = s.coords; el.dispatchEvent(new Event('change')); });
  set('show2d', (el) => { el.checked = s.show2d; el.dispatchEvent(new Event('change')); });
  set('animate', (el) => { el.checked = s.animate; });
  set('useBook', (el) => { el.checked = s.book; });
  set('skill', (el) => { el.value = s.skill; });
  set('strength', (el) => { el.value = String(s.strength); });
  set('clockMin', (el) => { el.value = String(s.clockMin); });
}
