function rng(seed) {
  let s = BigInt(seed);
  return () => {
    s ^= s << 13n;
    s ^= s >> 7n;
    s ^= s << 17n;
    return s & ((1n << 64n) - 1n);
  };
}

const rnd = rng(0xC0FFEE1234n);

export const Z_PIECE = Array.from({ length: 2 }, () =>
  Array.from({ length: 6 }, () => Array.from({ length: 64 }, () => rnd()))
);
export const Z_CASTLE = Array.from({ length: 16 }, () => rnd());
export const Z_EP = Array.from({ length: 8 }, () => rnd());
export const Z_SIDE = rnd();
