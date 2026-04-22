// Periodic table dataset — 118 elements.
// Data compiled from public sources (IUPAC / NIST public values).
export interface Element {
  number: number;
  symbol: string;
  name: string;
  mass: number;          // Atomic mass (u)
  category: string;
  group: number | null;  // 1–18, null for lanthanides/actinides
  period: number;
  block: 's' | 'p' | 'd' | 'f';
  electronConfig: string;
  electronegativity: number | null;
  phase: 'solid' | 'liquid' | 'gas' | 'unknown';
  discoveredBy?: string;
  summary: string;
}

// Position overrides for lanthanides/actinides (placed in separate rows below the main table).
// We use group=null and a display row of 8 (lanthanides) or 9 (actinides) with column = atomicNum - offset.
export const getGridPosition = (el: Element): { row: number; col: number } | null => {
  // Lanthanides 57..71 -> row 8 cols 3..17 (col = 3 + (num-57))
  if (el.number >= 57 && el.number <= 71) {
    return { row: 8, col: 3 + (el.number - 57) };
  }
  // Actinides 89..103 -> row 9
  if (el.number >= 89 && el.number <= 103) {
    return { row: 9, col: 3 + (el.number - 89) };
  }
  if (el.group == null) return null;
  return { row: el.period, col: el.group };
};

export const elements: Element[] = [
  { number: 1, symbol: 'H', name: 'Hydrogen', mass: 1.008, category: 'Reactive nonmetal', group: 1, period: 1, block: 's', electronConfig: '1s¹', electronegativity: 2.20, phase: 'gas', discoveredBy: 'Henry Cavendish (1766)', summary: 'Lightest and most abundant element in the universe. Fuel of stars.' },
  { number: 2, symbol: 'He', name: 'Helium', mass: 4.0026, category: 'Noble gas', group: 18, period: 1, block: 's', electronConfig: '1s²', electronegativity: null, phase: 'gas', discoveredBy: 'Janssen & Lockyer (1868)', summary: 'Inert noble gas used in balloons and cryogenics.' },
  { number: 3, symbol: 'Li', name: 'Lithium', mass: 6.94, category: 'Alkali metal', group: 1, period: 2, block: 's', electronConfig: '[He] 2s¹', electronegativity: 0.98, phase: 'solid', discoveredBy: 'Johan August Arfwedson (1817)', summary: 'Lightest solid metal; used in rechargeable batteries.' },
  { number: 4, symbol: 'Be', name: 'Beryllium', mass: 9.0122, category: 'Alkaline earth metal', group: 2, period: 2, block: 's', electronConfig: '[He] 2s²', electronegativity: 1.57, phase: 'solid', summary: 'Light, stiff metal used in aerospace alloys.' },
  { number: 5, symbol: 'B', name: 'Boron', mass: 10.81, category: 'Metalloid', group: 13, period: 2, block: 'p', electronConfig: '[He] 2s² 2p¹', electronegativity: 2.04, phase: 'solid', summary: 'Metalloid used in glass, detergents, and semiconductors.' },
  { number: 6, symbol: 'C', name: 'Carbon', mass: 12.011, category: 'Reactive nonmetal', group: 14, period: 2, block: 'p', electronConfig: '[He] 2s² 2p²', electronegativity: 2.55, phase: 'solid', summary: 'Basis of all known life. Forms diamond, graphite, and organic chemistry.' },
  { number: 7, symbol: 'N', name: 'Nitrogen', mass: 14.007, category: 'Reactive nonmetal', group: 15, period: 2, block: 'p', electronConfig: '[He] 2s² 2p³', electronegativity: 3.04, phase: 'gas', summary: 'Makes up 78% of Earth\'s atmosphere.' },
  { number: 8, symbol: 'O', name: 'Oxygen', mass: 15.999, category: 'Reactive nonmetal', group: 16, period: 2, block: 'p', electronConfig: '[He] 2s² 2p⁴', electronegativity: 3.44, phase: 'gas', summary: 'Essential for respiration and combustion.' },
  { number: 9, symbol: 'F', name: 'Fluorine', mass: 18.998, category: 'Halogen', group: 17, period: 2, block: 'p', electronConfig: '[He] 2s² 2p⁵', electronegativity: 3.98, phase: 'gas', summary: 'Most electronegative element. Used in toothpaste and Teflon.' },
  { number: 10, symbol: 'Ne', name: 'Neon', mass: 20.180, category: 'Noble gas', group: 18, period: 2, block: 'p', electronConfig: '[He] 2s² 2p⁶', electronegativity: null, phase: 'gas', summary: 'Noble gas used in glowing signs.' },
  { number: 11, symbol: 'Na', name: 'Sodium', mass: 22.990, category: 'Alkali metal', group: 1, period: 3, block: 's', electronConfig: '[Ne] 3s¹', electronegativity: 0.93, phase: 'solid', summary: 'Soft reactive metal; forms table salt (NaCl).' },
  { number: 12, symbol: 'Mg', name: 'Magnesium', mass: 24.305, category: 'Alkaline earth metal', group: 2, period: 3, block: 's', electronConfig: '[Ne] 3s²', electronegativity: 1.31, phase: 'solid', summary: 'Light structural metal; burns bright white.' },
  { number: 13, symbol: 'Al', name: 'Aluminium', mass: 26.982, category: 'Post-transition metal', group: 13, period: 3, block: 'p', electronConfig: '[Ne] 3s² 3p¹', electronegativity: 1.61, phase: 'solid', summary: 'Third most abundant element in Earth\'s crust.' },
  { number: 14, symbol: 'Si', name: 'Silicon', mass: 28.085, category: 'Metalloid', group: 14, period: 3, block: 'p', electronConfig: '[Ne] 3s² 3p²', electronegativity: 1.90, phase: 'solid', summary: 'Foundation of modern electronics and glass.' },
  { number: 15, symbol: 'P', name: 'Phosphorus', mass: 30.974, category: 'Reactive nonmetal', group: 15, period: 3, block: 'p', electronConfig: '[Ne] 3s² 3p³', electronegativity: 2.19, phase: 'solid', summary: 'Essential in DNA, ATP, and fertilizers.' },
  { number: 16, symbol: 'S', name: 'Sulfur', mass: 32.06, category: 'Reactive nonmetal', group: 16, period: 3, block: 'p', electronConfig: '[Ne] 3s² 3p⁴', electronegativity: 2.58, phase: 'solid', summary: 'Yellow solid; key industrial chemical (H₂SO₄).' },
  { number: 17, symbol: 'Cl', name: 'Chlorine', mass: 35.45, category: 'Halogen', group: 17, period: 3, block: 'p', electronConfig: '[Ne] 3s² 3p⁵', electronegativity: 3.16, phase: 'gas', summary: 'Disinfectant; component of table salt.' },
  { number: 18, symbol: 'Ar', name: 'Argon', mass: 39.948, category: 'Noble gas', group: 18, period: 3, block: 'p', electronConfig: '[Ne] 3s² 3p⁶', electronegativity: null, phase: 'gas', summary: 'Inert noble gas used in light bulbs and welding.' },
  { number: 19, symbol: 'K', name: 'Potassium', mass: 39.098, category: 'Alkali metal', group: 1, period: 4, block: 's', electronConfig: '[Ar] 4s¹', electronegativity: 0.82, phase: 'solid', summary: 'Essential nutrient; violent reaction with water.' },
  { number: 20, symbol: 'Ca', name: 'Calcium', mass: 40.078, category: 'Alkaline earth metal', group: 2, period: 4, block: 's', electronConfig: '[Ar] 4s²', electronegativity: 1.00, phase: 'solid', summary: 'Builds bones and teeth; main component of limestone.' },
  { number: 21, symbol: 'Sc', name: 'Scandium', mass: 44.956, category: 'Transition metal', group: 3, period: 4, block: 'd', electronConfig: '[Ar] 3d¹ 4s²', electronegativity: 1.36, phase: 'solid', summary: 'Rare transition metal used in aerospace alloys.' },
  { number: 22, symbol: 'Ti', name: 'Titanium', mass: 47.867, category: 'Transition metal', group: 4, period: 4, block: 'd', electronConfig: '[Ar] 3d² 4s²', electronegativity: 1.54, phase: 'solid', summary: 'Strong, low-density metal; used in implants and jets.' },
  { number: 23, symbol: 'V', name: 'Vanadium', mass: 50.942, category: 'Transition metal', group: 5, period: 4, block: 'd', electronConfig: '[Ar] 3d³ 4s²', electronegativity: 1.63, phase: 'solid', summary: 'Hardens steel alloys.' },
  { number: 24, symbol: 'Cr', name: 'Chromium', mass: 51.996, category: 'Transition metal', group: 6, period: 4, block: 'd', electronConfig: '[Ar] 3d⁵ 4s¹', electronegativity: 1.66, phase: 'solid', summary: 'Gives stainless steel its shine and corrosion resistance.' },
  { number: 25, symbol: 'Mn', name: 'Manganese', mass: 54.938, category: 'Transition metal', group: 7, period: 4, block: 'd', electronConfig: '[Ar] 3d⁵ 4s²', electronegativity: 1.55, phase: 'solid', summary: 'Essential for steel making.' },
  { number: 26, symbol: 'Fe', name: 'Iron', mass: 55.845, category: 'Transition metal', group: 8, period: 4, block: 'd', electronConfig: '[Ar] 3d⁶ 4s²', electronegativity: 1.83, phase: 'solid', summary: 'Most used metal. Core of Earth; carries O₂ in blood.' },
  { number: 27, symbol: 'Co', name: 'Cobalt', mass: 58.933, category: 'Transition metal', group: 9, period: 4, block: 'd', electronConfig: '[Ar] 3d⁷ 4s²', electronegativity: 1.88, phase: 'solid', summary: 'Magnetic; used in lithium-ion batteries.' },
  { number: 28, symbol: 'Ni', name: 'Nickel', mass: 58.693, category: 'Transition metal', group: 10, period: 4, block: 'd', electronConfig: '[Ar] 3d⁸ 4s²', electronegativity: 1.91, phase: 'solid', summary: 'Corrosion-resistant; used in coins and stainless steel.' },
  { number: 29, symbol: 'Cu', name: 'Copper', mass: 63.546, category: 'Transition metal', group: 11, period: 4, block: 'd', electronConfig: '[Ar] 3d¹⁰ 4s¹', electronegativity: 1.90, phase: 'solid', summary: 'Excellent conductor; used in wiring.' },
  { number: 30, symbol: 'Zn', name: 'Zinc', mass: 65.38, category: 'Transition metal', group: 12, period: 4, block: 'd', electronConfig: '[Ar] 3d¹⁰ 4s²', electronegativity: 1.65, phase: 'solid', summary: 'Galvanizes steel; essential trace nutrient.' },
  { number: 31, symbol: 'Ga', name: 'Gallium', mass: 69.723, category: 'Post-transition metal', group: 13, period: 4, block: 'p', electronConfig: '[Ar] 3d¹⁰ 4s² 4p¹', electronegativity: 1.81, phase: 'solid', summary: 'Melts in your hand (30°C).' },
  { number: 32, symbol: 'Ge', name: 'Germanium', mass: 72.630, category: 'Metalloid', group: 14, period: 4, block: 'p', electronConfig: '[Ar] 3d¹⁰ 4s² 4p²', electronegativity: 2.01, phase: 'solid', summary: 'Semiconductor used in fiber optics.' },
  { number: 33, symbol: 'As', name: 'Arsenic', mass: 74.922, category: 'Metalloid', group: 15, period: 4, block: 'p', electronConfig: '[Ar] 3d¹⁰ 4s² 4p³', electronegativity: 2.18, phase: 'solid', summary: 'Toxic metalloid; used in some semiconductors.' },
  { number: 34, symbol: 'Se', name: 'Selenium', mass: 78.971, category: 'Reactive nonmetal', group: 16, period: 4, block: 'p', electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁴', electronegativity: 2.55, phase: 'solid', summary: 'Essential trace element; photoconductive.' },
  { number: 35, symbol: 'Br', name: 'Bromine', mass: 79.904, category: 'Halogen', group: 17, period: 4, block: 'p', electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁵', electronegativity: 2.96, phase: 'liquid', summary: 'Only non-metal liquid at room temperature (besides Hg).' },
  { number: 36, symbol: 'Kr', name: 'Krypton', mass: 83.798, category: 'Noble gas', group: 18, period: 4, block: 'p', electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁶', electronegativity: 3.00, phase: 'gas', summary: 'Noble gas used in high-performance lighting.' },
  { number: 37, symbol: 'Rb', name: 'Rubidium', mass: 85.468, category: 'Alkali metal', group: 1, period: 5, block: 's', electronConfig: '[Kr] 5s¹', electronegativity: 0.82, phase: 'solid', summary: 'Highly reactive alkali metal.' },
  { number: 38, symbol: 'Sr', name: 'Strontium', mass: 87.62, category: 'Alkaline earth metal', group: 2, period: 5, block: 's', electronConfig: '[Kr] 5s²', electronegativity: 0.95, phase: 'solid', summary: 'Produces red color in fireworks.' },
  { number: 39, symbol: 'Y', name: 'Yttrium', mass: 88.906, category: 'Transition metal', group: 3, period: 5, block: 'd', electronConfig: '[Kr] 4d¹ 5s²', electronegativity: 1.22, phase: 'solid', summary: 'Used in LEDs and superconductors.' },
  { number: 40, symbol: 'Zr', name: 'Zirconium', mass: 91.224, category: 'Transition metal', group: 4, period: 5, block: 'd', electronConfig: '[Kr] 4d² 5s²', electronegativity: 1.33, phase: 'solid', summary: 'Corrosion-resistant; used in nuclear reactors.' },
  { number: 41, symbol: 'Nb', name: 'Niobium', mass: 92.906, category: 'Transition metal', group: 5, period: 5, block: 'd', electronConfig: '[Kr] 4d⁴ 5s¹', electronegativity: 1.6, phase: 'solid', summary: 'Superconductor at low temps.' },
  { number: 42, symbol: 'Mo', name: 'Molybdenum', mass: 95.95, category: 'Transition metal', group: 6, period: 5, block: 'd', electronConfig: '[Kr] 4d⁵ 5s¹', electronegativity: 2.16, phase: 'solid', summary: 'Strengthens steel alloys.' },
  { number: 43, symbol: 'Tc', name: 'Technetium', mass: 98, category: 'Transition metal', group: 7, period: 5, block: 'd', electronConfig: '[Kr] 4d⁵ 5s²', electronegativity: 1.9, phase: 'solid', summary: 'First artificial element; used in medical imaging.' },
  { number: 44, symbol: 'Ru', name: 'Ruthenium', mass: 101.07, category: 'Transition metal', group: 8, period: 5, block: 'd', electronConfig: '[Kr] 4d⁷ 5s¹', electronegativity: 2.2, phase: 'solid', summary: 'Platinum-group metal; used in electronics.' },
  { number: 45, symbol: 'Rh', name: 'Rhodium', mass: 102.91, category: 'Transition metal', group: 9, period: 5, block: 'd', electronConfig: '[Kr] 4d⁸ 5s¹', electronegativity: 2.28, phase: 'solid', summary: 'Catalyst in cars (catalytic converters).' },
  { number: 46, symbol: 'Pd', name: 'Palladium', mass: 106.42, category: 'Transition metal', group: 10, period: 5, block: 'd', electronConfig: '[Kr] 4d¹⁰', electronegativity: 2.20, phase: 'solid', summary: 'Valuable catalyst; absorbs H₂.' },
  { number: 47, symbol: 'Ag', name: 'Silver', mass: 107.87, category: 'Transition metal', group: 11, period: 5, block: 'd', electronConfig: '[Kr] 4d¹⁰ 5s¹', electronegativity: 1.93, phase: 'solid', summary: 'Best electrical conductor of all metals.' },
  { number: 48, symbol: 'Cd', name: 'Cadmium', mass: 112.41, category: 'Transition metal', group: 12, period: 5, block: 'd', electronConfig: '[Kr] 4d¹⁰ 5s²', electronegativity: 1.69, phase: 'solid', summary: 'Toxic; used in NiCd batteries and pigments.' },
  { number: 49, symbol: 'In', name: 'Indium', mass: 114.82, category: 'Post-transition metal', group: 13, period: 5, block: 'p', electronConfig: '[Kr] 4d¹⁰ 5s² 5p¹', electronegativity: 1.78, phase: 'solid', summary: 'Used in touchscreens (ITO).' },
  { number: 50, symbol: 'Sn', name: 'Tin', mass: 118.71, category: 'Post-transition metal', group: 14, period: 5, block: 'p', electronConfig: '[Kr] 4d¹⁰ 5s² 5p²', electronegativity: 1.96, phase: 'solid', summary: 'Used in solder and tin cans (coating).' },
  { number: 51, symbol: 'Sb', name: 'Antimony', mass: 121.76, category: 'Metalloid', group: 15, period: 5, block: 'p', electronConfig: '[Kr] 4d¹⁰ 5s² 5p³', electronegativity: 2.05, phase: 'solid', summary: 'Flame retardant; used in alloys.' },
  { number: 52, symbol: 'Te', name: 'Tellurium', mass: 127.60, category: 'Metalloid', group: 16, period: 5, block: 'p', electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁴', electronegativity: 2.1, phase: 'solid', summary: 'Rare metalloid; used in solar cells.' },
  { number: 53, symbol: 'I', name: 'Iodine', mass: 126.90, category: 'Halogen', group: 17, period: 5, block: 'p', electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁵', electronegativity: 2.66, phase: 'solid', summary: 'Essential for thyroid function; antiseptic.' },
  { number: 54, symbol: 'Xe', name: 'Xenon', mass: 131.29, category: 'Noble gas', group: 18, period: 5, block: 'p', electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁶', electronegativity: 2.60, phase: 'gas', summary: 'Used in anesthetic and high-intensity lamps.' },
  { number: 55, symbol: 'Cs', name: 'Caesium', mass: 132.91, category: 'Alkali metal', group: 1, period: 6, block: 's', electronConfig: '[Xe] 6s¹', electronegativity: 0.79, phase: 'solid', summary: 'Defines the second (atomic clocks).' },
  { number: 56, symbol: 'Ba', name: 'Barium', mass: 137.33, category: 'Alkaline earth metal', group: 2, period: 6, block: 's', electronConfig: '[Xe] 6s²', electronegativity: 0.89, phase: 'solid', summary: 'Used in medical imaging (barium meal).' },
  { number: 57, symbol: 'La', name: 'Lanthanum', mass: 138.91, category: 'Lanthanide', group: null, period: 6, block: 'f', electronConfig: '[Xe] 5d¹ 6s²', electronegativity: 1.10, phase: 'solid', summary: 'Used in camera lenses and catalysts.' },
  { number: 58, symbol: 'Ce', name: 'Cerium', mass: 140.12, category: 'Lanthanide', group: null, period: 6, block: 'f', electronConfig: '[Xe] 4f¹ 5d¹ 6s²', electronegativity: 1.12, phase: 'solid', summary: 'Most abundant rare earth; used in lighter flints.' },
  { number: 59, symbol: 'Pr', name: 'Praseodymium', mass: 140.91, category: 'Lanthanide', group: null, period: 6, block: 'f', electronConfig: '[Xe] 4f³ 6s²', electronegativity: 1.13, phase: 'solid', summary: 'Used in strong magnets.' },
  { number: 60, symbol: 'Nd', name: 'Neodymium', mass: 144.24, category: 'Lanthanide', group: null, period: 6, block: 'f', electronConfig: '[Xe] 4f⁴ 6s²', electronegativity: 1.14, phase: 'solid', summary: 'Makes the strongest permanent magnets.' },
  { number: 61, symbol: 'Pm', name: 'Promethium', mass: 145, category: 'Lanthanide', group: null, period: 6, block: 'f', electronConfig: '[Xe] 4f⁵ 6s²', electronegativity: 1.13, phase: 'solid', summary: 'Radioactive; used in luminous paint.' },
  { number: 62, symbol: 'Sm', name: 'Samarium', mass: 150.36, category: 'Lanthanide', group: null, period: 6, block: 'f', electronConfig: '[Xe] 4f⁶ 6s²', electronegativity: 1.17, phase: 'solid', summary: 'Used in SmCo magnets.' },
  { number: 63, symbol: 'Eu', name: 'Europium', mass: 151.96, category: 'Lanthanide', group: null, period: 6, block: 'f', electronConfig: '[Xe] 4f⁷ 6s²', electronegativity: 1.2, phase: 'solid', summary: 'Red phosphor in TV screens.' },
  { number: 64, symbol: 'Gd', name: 'Gadolinium', mass: 157.25, category: 'Lanthanide', group: null, period: 6, block: 'f', electronConfig: '[Xe] 4f⁷ 5d¹ 6s²', electronegativity: 1.20, phase: 'solid', summary: 'MRI contrast agent.' },
  { number: 65, symbol: 'Tb', name: 'Terbium', mass: 158.93, category: 'Lanthanide', group: null, period: 6, block: 'f', electronConfig: '[Xe] 4f⁹ 6s²', electronegativity: 1.2, phase: 'solid', summary: 'Green phosphor in lamps.' },
  { number: 66, symbol: 'Dy', name: 'Dysprosium', mass: 162.50, category: 'Lanthanide', group: null, period: 6, block: 'f', electronConfig: '[Xe] 4f¹⁰ 6s²', electronegativity: 1.22, phase: 'solid', summary: 'Used in wind-turbine magnets.' },
  { number: 67, symbol: 'Ho', name: 'Holmium', mass: 164.93, category: 'Lanthanide', group: null, period: 6, block: 'f', electronConfig: '[Xe] 4f¹¹ 6s²', electronegativity: 1.23, phase: 'solid', summary: 'Has the strongest magnetic moment of any element.' },
  { number: 68, symbol: 'Er', name: 'Erbium', mass: 167.26, category: 'Lanthanide', group: null, period: 6, block: 'f', electronConfig: '[Xe] 4f¹² 6s²', electronegativity: 1.24, phase: 'solid', summary: 'Used in fiber-optic amplifiers.' },
  { number: 69, symbol: 'Tm', name: 'Thulium', mass: 168.93, category: 'Lanthanide', group: null, period: 6, block: 'f', electronConfig: '[Xe] 4f¹³ 6s²', electronegativity: 1.25, phase: 'solid', summary: 'Rarest stable lanthanide.' },
  { number: 70, symbol: 'Yb', name: 'Ytterbium', mass: 173.05, category: 'Lanthanide', group: null, period: 6, block: 'f', electronConfig: '[Xe] 4f¹⁴ 6s²', electronegativity: 1.1, phase: 'solid', summary: 'Used in atomic clocks.' },
  { number: 71, symbol: 'Lu', name: 'Lutetium', mass: 174.97, category: 'Lanthanide', group: null, period: 6, block: 'd', electronConfig: '[Xe] 4f¹⁴ 5d¹ 6s²', electronegativity: 1.27, phase: 'solid', summary: 'Hardest and densest lanthanide.' },
  { number: 72, symbol: 'Hf', name: 'Hafnium', mass: 178.49, category: 'Transition metal', group: 4, period: 6, block: 'd', electronConfig: '[Xe] 4f¹⁴ 5d² 6s²', electronegativity: 1.3, phase: 'solid', summary: 'Used in nuclear control rods.' },
  { number: 73, symbol: 'Ta', name: 'Tantalum', mass: 180.95, category: 'Transition metal', group: 5, period: 6, block: 'd', electronConfig: '[Xe] 4f¹⁴ 5d³ 6s²', electronegativity: 1.5, phase: 'solid', summary: 'Used in phone capacitors.' },
  { number: 74, symbol: 'W', name: 'Tungsten', mass: 183.84, category: 'Transition metal', group: 6, period: 6, block: 'd', electronConfig: '[Xe] 4f¹⁴ 5d⁴ 6s²', electronegativity: 2.36, phase: 'solid', summary: 'Highest melting point of all metals.' },
  { number: 75, symbol: 'Re', name: 'Rhenium', mass: 186.21, category: 'Transition metal', group: 7, period: 6, block: 'd', electronConfig: '[Xe] 4f¹⁴ 5d⁵ 6s²', electronegativity: 1.9, phase: 'solid', summary: 'Jet engine superalloys.' },
  { number: 76, symbol: 'Os', name: 'Osmium', mass: 190.23, category: 'Transition metal', group: 8, period: 6, block: 'd', electronConfig: '[Xe] 4f¹⁴ 5d⁶ 6s²', electronegativity: 2.2, phase: 'solid', summary: 'Densest naturally occurring element.' },
  { number: 77, symbol: 'Ir', name: 'Iridium', mass: 192.22, category: 'Transition metal', group: 9, period: 6, block: 'd', electronConfig: '[Xe] 4f¹⁴ 5d⁷ 6s²', electronegativity: 2.20, phase: 'solid', summary: 'Most corrosion-resistant metal.' },
  { number: 78, symbol: 'Pt', name: 'Platinum', mass: 195.08, category: 'Transition metal', group: 10, period: 6, block: 'd', electronConfig: '[Xe] 4f¹⁴ 5d⁹ 6s¹', electronegativity: 2.28, phase: 'solid', summary: 'Catalyst and jewelry.' },
  { number: 79, symbol: 'Au', name: 'Gold', mass: 196.97, category: 'Transition metal', group: 11, period: 6, block: 'd', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', electronegativity: 2.54, phase: 'solid', summary: 'Precious metal; excellent conductor.' },
  { number: 80, symbol: 'Hg', name: 'Mercury', mass: 200.59, category: 'Transition metal', group: 12, period: 6, block: 'd', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s²', electronegativity: 2.00, phase: 'liquid', summary: 'Only metal liquid at room temperature.' },
  { number: 81, symbol: 'Tl', name: 'Thallium', mass: 204.38, category: 'Post-transition metal', group: 13, period: 6, block: 'p', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹', electronegativity: 1.62, phase: 'solid', summary: 'Highly toxic.' },
  { number: 82, symbol: 'Pb', name: 'Lead', mass: 207.2, category: 'Post-transition metal', group: 14, period: 6, block: 'p', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²', electronegativity: 2.33, phase: 'solid', summary: 'Dense, soft; used in batteries and shielding.' },
  { number: 83, symbol: 'Bi', name: 'Bismuth', mass: 208.98, category: 'Post-transition metal', group: 15, period: 6, block: 'p', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³', electronegativity: 2.02, phase: 'solid', summary: 'Used in Pepto-Bismol; low toxicity.' },
  { number: 84, symbol: 'Po', name: 'Polonium', mass: 209, category: 'Post-transition metal', group: 16, period: 6, block: 'p', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴', electronegativity: 2.0, phase: 'solid', summary: 'Highly radioactive; discovered by Marie Curie.' },
  { number: 85, symbol: 'At', name: 'Astatine', mass: 210, category: 'Halogen', group: 17, period: 6, block: 'p', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵', electronegativity: 2.2, phase: 'solid', summary: 'Rarest naturally occurring element.' },
  { number: 86, symbol: 'Rn', name: 'Radon', mass: 222, category: 'Noble gas', group: 18, period: 6, block: 'p', electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶', electronegativity: 2.2, phase: 'gas', summary: 'Radioactive noble gas; health hazard in basements.' },
  { number: 87, symbol: 'Fr', name: 'Francium', mass: 223, category: 'Alkali metal', group: 1, period: 7, block: 's', electronConfig: '[Rn] 7s¹', electronegativity: 0.7, phase: 'solid', summary: 'Highly radioactive; second-rarest natural element.' },
  { number: 88, symbol: 'Ra', name: 'Radium', mass: 226, category: 'Alkaline earth metal', group: 2, period: 7, block: 's', electronConfig: '[Rn] 7s²', electronegativity: 0.9, phase: 'solid', summary: 'Glows in the dark; highly radioactive.' },
  { number: 89, symbol: 'Ac', name: 'Actinium', mass: 227, category: 'Actinide', group: null, period: 7, block: 'f', electronConfig: '[Rn] 6d¹ 7s²', electronegativity: 1.1, phase: 'solid', summary: 'Radioactive; used in cancer therapy research.' },
  { number: 90, symbol: 'Th', name: 'Thorium', mass: 232.04, category: 'Actinide', group: null, period: 7, block: 'f', electronConfig: '[Rn] 6d² 7s²', electronegativity: 1.3, phase: 'solid', summary: 'Potential nuclear fuel.' },
  { number: 91, symbol: 'Pa', name: 'Protactinium', mass: 231.04, category: 'Actinide', group: null, period: 7, block: 'f', electronConfig: '[Rn] 5f² 6d¹ 7s²', electronegativity: 1.5, phase: 'solid', summary: 'Rare, radioactive.' },
  { number: 92, symbol: 'U', name: 'Uranium', mass: 238.03, category: 'Actinide', group: null, period: 7, block: 'f', electronConfig: '[Rn] 5f³ 6d¹ 7s²', electronegativity: 1.38, phase: 'solid', summary: 'Nuclear fuel; heaviest natural element.' },
  { number: 93, symbol: 'Np', name: 'Neptunium', mass: 237, category: 'Actinide', group: null, period: 7, block: 'f', electronConfig: '[Rn] 5f⁴ 6d¹ 7s²', electronegativity: 1.36, phase: 'solid', summary: 'First synthetic transuranium element.' },
  { number: 94, symbol: 'Pu', name: 'Plutonium', mass: 244, category: 'Actinide', group: null, period: 7, block: 'f', electronConfig: '[Rn] 5f⁶ 7s²', electronegativity: 1.28, phase: 'solid', summary: 'Used in nuclear weapons and RTGs.' },
  { number: 95, symbol: 'Am', name: 'Americium', mass: 243, category: 'Actinide', group: null, period: 7, block: 'f', electronConfig: '[Rn] 5f⁷ 7s²', electronegativity: 1.3, phase: 'solid', summary: 'Used in smoke detectors.' },
  { number: 96, symbol: 'Cm', name: 'Curium', mass: 247, category: 'Actinide', group: null, period: 7, block: 'f', electronConfig: '[Rn] 5f⁷ 6d¹ 7s²', electronegativity: 1.3, phase: 'solid', summary: 'Named after the Curies.' },
  { number: 97, symbol: 'Bk', name: 'Berkelium', mass: 247, category: 'Actinide', group: null, period: 7, block: 'f', electronConfig: '[Rn] 5f⁹ 7s²', electronegativity: 1.3, phase: 'solid', summary: 'Synthetic; used in research.' },
  { number: 98, symbol: 'Cf', name: 'Californium', mass: 251, category: 'Actinide', group: null, period: 7, block: 'f', electronConfig: '[Rn] 5f¹⁰ 7s²', electronegativity: 1.3, phase: 'solid', summary: 'Strong neutron emitter.' },
  { number: 99, symbol: 'Es', name: 'Einsteinium', mass: 252, category: 'Actinide', group: null, period: 7, block: 'f', electronConfig: '[Rn] 5f¹¹ 7s²', electronegativity: 1.3, phase: 'solid', summary: 'Named after Einstein.' },
  { number: 100, symbol: 'Fm', name: 'Fermium', mass: 257, category: 'Actinide', group: null, period: 7, block: 'f', electronConfig: '[Rn] 5f¹² 7s²', electronegativity: 1.3, phase: 'solid', summary: 'Named after Fermi.' },
  { number: 101, symbol: 'Md', name: 'Mendelevium', mass: 258, category: 'Actinide', group: null, period: 7, block: 'f', electronConfig: '[Rn] 5f¹³ 7s²', electronegativity: 1.3, phase: 'solid', summary: 'Named after Mendeleev.' },
  { number: 102, symbol: 'No', name: 'Nobelium', mass: 259, category: 'Actinide', group: null, period: 7, block: 'f', electronConfig: '[Rn] 5f¹⁴ 7s²', electronegativity: 1.3, phase: 'solid', summary: 'Named after Alfred Nobel.' },
  { number: 103, symbol: 'Lr', name: 'Lawrencium', mass: 266, category: 'Actinide', group: null, period: 7, block: 'd', electronConfig: '[Rn] 5f¹⁴ 7s² 7p¹', electronegativity: 1.3, phase: 'solid', summary: 'Named after Ernest Lawrence.' },
  { number: 104, symbol: 'Rf', name: 'Rutherfordium', mass: 267, category: 'Transition metal', group: 4, period: 7, block: 'd', electronConfig: '[Rn] 5f¹⁴ 6d² 7s²', electronegativity: null, phase: 'unknown', summary: 'Superheavy synthetic element.' },
  { number: 105, symbol: 'Db', name: 'Dubnium', mass: 268, category: 'Transition metal', group: 5, period: 7, block: 'd', electronConfig: '[Rn] 5f¹⁴ 6d³ 7s²', electronegativity: null, phase: 'unknown', summary: 'Synthetic; named after Dubna, Russia.' },
  { number: 106, symbol: 'Sg', name: 'Seaborgium', mass: 269, category: 'Transition metal', group: 6, period: 7, block: 'd', electronConfig: '[Rn] 5f¹⁴ 6d⁴ 7s²', electronegativity: null, phase: 'unknown', summary: 'Named after Glenn Seaborg.' },
  { number: 107, symbol: 'Bh', name: 'Bohrium', mass: 270, category: 'Transition metal', group: 7, period: 7, block: 'd', electronConfig: '[Rn] 5f¹⁴ 6d⁵ 7s²', electronegativity: null, phase: 'unknown', summary: 'Named after Niels Bohr.' },
  { number: 108, symbol: 'Hs', name: 'Hassium', mass: 269, category: 'Transition metal', group: 8, period: 7, block: 'd', electronConfig: '[Rn] 5f¹⁴ 6d⁶ 7s²', electronegativity: null, phase: 'unknown', summary: 'Named after Hesse, Germany.' },
  { number: 109, symbol: 'Mt', name: 'Meitnerium', mass: 278, category: 'Transition metal', group: 9, period: 7, block: 'd', electronConfig: '[Rn] 5f¹⁴ 6d⁷ 7s²', electronegativity: null, phase: 'unknown', summary: 'Named after Lise Meitner.' },
  { number: 110, symbol: 'Ds', name: 'Darmstadtium', mass: 281, category: 'Transition metal', group: 10, period: 7, block: 'd', electronConfig: '[Rn] 5f¹⁴ 6d⁸ 7s²', electronegativity: null, phase: 'unknown', summary: 'Named after Darmstadt, Germany.' },
  { number: 111, symbol: 'Rg', name: 'Roentgenium', mass: 282, category: 'Transition metal', group: 11, period: 7, block: 'd', electronConfig: '[Rn] 5f¹⁴ 6d⁹ 7s²', electronegativity: null, phase: 'unknown', summary: 'Named after Wilhelm Röntgen.' },
  { number: 112, symbol: 'Cn', name: 'Copernicium', mass: 285, category: 'Transition metal', group: 12, period: 7, block: 'd', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s²', electronegativity: null, phase: 'unknown', summary: 'Named after Copernicus.' },
  { number: 113, symbol: 'Nh', name: 'Nihonium', mass: 286, category: 'Post-transition metal', group: 13, period: 7, block: 'p', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹', electronegativity: null, phase: 'unknown', summary: 'Named after Japan (Nihon).' },
  { number: 114, symbol: 'Fl', name: 'Flerovium', mass: 289, category: 'Post-transition metal', group: 14, period: 7, block: 'p', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²', electronegativity: null, phase: 'unknown', summary: 'Named after Georgy Flyorov.' },
  { number: 115, symbol: 'Mc', name: 'Moscovium', mass: 289, category: 'Post-transition metal', group: 15, period: 7, block: 'p', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³', electronegativity: null, phase: 'unknown', summary: 'Named after Moscow.' },
  { number: 116, symbol: 'Lv', name: 'Livermorium', mass: 293, category: 'Post-transition metal', group: 16, period: 7, block: 'p', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴', electronegativity: null, phase: 'unknown', summary: 'Named after Livermore Lab.' },
  { number: 117, symbol: 'Ts', name: 'Tennessine', mass: 294, category: 'Halogen', group: 17, period: 7, block: 'p', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵', electronegativity: null, phase: 'unknown', summary: 'Named after Tennessee.' },
  { number: 118, symbol: 'Og', name: 'Oganesson', mass: 294, category: 'Noble gas', group: 18, period: 7, block: 'p', electronConfig: '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶', electronegativity: null, phase: 'unknown', summary: 'Heaviest known element.' },
];

export const categoryColor = (cat: string): string => {
  const map: Record<string, string> = {
    'Alkali metal': 'bg-red-500/80',
    'Alkaline earth metal': 'bg-orange-500/80',
    'Transition metal': 'bg-amber-500/80',
    'Post-transition metal': 'bg-lime-600/80',
    'Metalloid': 'bg-emerald-500/80',
    'Reactive nonmetal': 'bg-cyan-500/80',
    'Noble gas': 'bg-violet-500/80',
    'Halogen': 'bg-sky-500/80',
    'Lanthanide': 'bg-pink-500/80',
    'Actinide': 'bg-rose-600/80',
  };
  return map[cat] || 'bg-gray-500/80';
};
