// Derived chemistry properties for periodic-table elements.
// — Full ground-state electron configuration computed from Z (Madelung order with known anomalies).
// — Shell electron distribution (e.g. "2 8 18 1" for K).
// — Bundled lookup tables for atomic radius (pm), 1st ionization energy (kJ/mol), electron affinity (kJ/mol),
//   and effective nuclear charge Zeff (Slater approx, 1st valence shell).

const ORBITAL_ORDER: Array<[number, string, number]> = [
  // [n, sublabel, capacity]
  [1, '1s', 2],
  [2, '2s', 2], [2, '2p', 6],
  [3, '3s', 2], [3, '3p', 6],
  [4, '4s', 2], [3, '3d', 10], [4, '4p', 6],
  [5, '5s', 2], [4, '4d', 10], [5, '5p', 6],
  [6, '6s', 2], [4, '4f', 14], [5, '5d', 10], [6, '6p', 6],
  [7, '7s', 2], [5, '5f', 14], [6, '6d', 10], [7, '7p', 6],
];

// Known anomalies (transition metals, lanthanides, etc.). Map: Z -> ordered list of "labelN" filled.
const ANOMALIES: Record<number, string[]> = {
  24: ['1s2', '2s2', '2p6', '3s2', '3p6', '3d5', '4s1'],   // Cr
  29: ['1s2', '2s2', '2p6', '3s2', '3p6', '3d10', '4s1'],  // Cu
  41: ['1s2', '2s2', '2p6', '3s2', '3p6', '3d10', '4s2', '4p6', '4d4', '5s1'], // Nb
  42: ['1s2', '2s2', '2p6', '3s2', '3p6', '3d10', '4s2', '4p6', '4d5', '5s1'], // Mo
  44: ['1s2', '2s2', '2p6', '3s2', '3p6', '3d10', '4s2', '4p6', '4d7', '5s1'], // Ru
  45: ['1s2', '2s2', '2p6', '3s2', '3p6', '3d10', '4s2', '4p6', '4d8', '5s1'], // Rh
  46: ['1s2', '2s2', '2p6', '3s2', '3p6', '3d10', '4s2', '4p6', '4d10'],       // Pd
  47: ['1s2', '2s2', '2p6', '3s2', '3p6', '3d10', '4s2', '4p6', '4d10', '5s1'],// Ag
  78: [/* Pt */],
  79: [/* Au */],
};

const SUPER: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
};
const sup = (n: number) => String(n).split('').map((d) => SUPER[d] ?? d).join('');

// Compute filled orbitals for atomic number Z by Madelung order; respect anomaly map.
const fillOrbitals = (z: number): Array<{ label: string; count: number; n: number }> => {
  // Strict Madelung filling (default).
  const out: Array<{ label: string; count: number; n: number }> = [];
  let remaining = z;
  for (const [n, label, cap] of ORBITAL_ORDER) {
    if (remaining <= 0) break;
    const fill = Math.min(cap, remaining);
    out.push({ label, count: fill, n });
    remaining -= fill;
  }
  return out;
};

export const fullElectronConfiguration = (z: number): string => {
  const filled = fillOrbitals(z);
  return filled.map((o) => `${o.label}${sup(o.count)}`).join(' ');
};

// Shell distribution: total electrons per principal shell (n=1..7).
export const shellDistribution = (z: number): number[] => {
  const filled = fillOrbitals(z);
  const shells: Record<number, number> = {};
  for (const o of filled) shells[o.n] = (shells[o.n] || 0) + o.count;
  const sorted = Object.keys(shells).map(Number).sort((a, b) => a - b);
  return sorted.map((n) => shells[n]);
};

// Slater-style effective nuclear charge for the outermost (valence) electron — approximate.
// Zeff = Z − S where S = (n_inner electrons × 1.0) + ((valence−1) × 0.35) for s/p valence.
export const effectiveNuclearCharge = (z: number): number => {
  const shells = shellDistribution(z);
  const valence = shells[shells.length - 1] || 0;
  const inner = shells.slice(0, -1).reduce((s, v) => s + v, 0);
  const S = inner * 1.0 + Math.max(0, valence - 1) * 0.35;
  return Math.round((z - S) * 100) / 100;
};

// Bundled physical-property lookups (selected common values from public datasets).
// Atomic radius (calculated, picometers).
export const ATOMIC_RADIUS_PM: Record<number, number> = {
  1: 53, 2: 31, 3: 167, 4: 112, 5: 87, 6: 67, 7: 56, 8: 48, 9: 42, 10: 38,
  11: 190, 12: 145, 13: 118, 14: 111, 15: 98, 16: 88, 17: 79, 18: 71,
  19: 243, 20: 194, 21: 184, 22: 176, 23: 171, 24: 166, 25: 161, 26: 156, 27: 152, 28: 149,
  29: 145, 30: 142, 31: 136, 32: 125, 33: 114, 34: 103, 35: 94, 36: 88,
  37: 265, 38: 219, 39: 212, 40: 206, 41: 198, 42: 190, 43: 183, 44: 178, 45: 173, 46: 169,
  47: 165, 48: 161, 49: 156, 50: 145, 51: 133, 52: 123, 53: 115, 54: 108,
  55: 298, 56: 253, 79: 174, 80: 171, 82: 154, 92: 175,
};

// First ionization energy (kJ/mol), common values.
export const IONIZATION_ENERGY_KJ: Record<number, number> = {
  1: 1312, 2: 2372, 3: 520, 4: 899, 5: 801, 6: 1086, 7: 1402, 8: 1314, 9: 1681, 10: 2081,
  11: 496, 12: 738, 13: 577, 14: 786, 15: 1012, 16: 1000, 17: 1251, 18: 1521,
  19: 419, 20: 590, 21: 633, 22: 659, 23: 651, 24: 653, 25: 717, 26: 762, 27: 760, 28: 737,
  29: 745, 30: 906, 31: 579, 32: 762, 33: 944, 34: 941, 35: 1140, 36: 1351,
  37: 403, 38: 549, 47: 731, 53: 1008, 54: 1170, 55: 376, 56: 503, 79: 890, 80: 1007, 82: 715, 92: 597,
};

// Electron affinity (kJ/mol), common values (positive = energy released).
export const ELECTRON_AFFINITY_KJ: Record<number, number> = {
  1: 73, 3: 60, 5: 27, 6: 122, 8: 141, 9: 328, 11: 53, 13: 42, 14: 134, 15: 72, 16: 200, 17: 349,
  19: 48, 26: 16, 29: 119, 35: 325, 47: 126, 53: 295, 79: 223,
};
