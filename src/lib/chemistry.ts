// Minimal chemistry helpers: parse a formula and compute molar mass.
// Supports nested parentheses and multipliers, e.g. Ca(OH)2, Al2(SO4)3.
import { elements } from '@/data/periodicTable';

const symbolMass: Record<string, number> = Object.fromEntries(
  elements.map((e) => [e.symbol, e.mass]),
);

export interface ParsedAtom {
  symbol: string;
  count: number;
  atomicMass: number;
}

// Tokenize + recursive parse.
const tokenize = (formula: string): string[] => {
  const out: string[] = [];
  const re = /([A-Z][a-z]?|\d+|\(|\))/g;
  let m;
  while ((m = re.exec(formula)) !== null) out.push(m[1]);
  return out;
};

const parseTokens = (tokens: string[], start: number): { counts: Record<string, number>; end: number } => {
  const counts: Record<string, number> = {};
  let i = start;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === '(') {
      const sub = parseTokens(tokens, i + 1);
      i = sub.end + 1;
      const next = tokens[i];
      let mult = 1;
      if (next && /^\d+$/.test(next)) { mult = parseInt(next, 10); i++; }
      for (const [k, v] of Object.entries(sub.counts)) {
        counts[k] = (counts[k] || 0) + v * mult;
      }
    } else if (t === ')') {
      return { counts, end: i };
    } else if (/^[A-Z][a-z]?$/.test(t)) {
      const next = tokens[i + 1];
      let mult = 1;
      if (next && /^\d+$/.test(next)) { mult = parseInt(next, 10); i += 2; } else { i++; }
      counts[t] = (counts[t] || 0) + mult;
    } else {
      i++;
    }
  }
  return { counts, end: i };
};

export const parseFormula = (formula: string): ParsedAtom[] => {
  if (!formula.trim()) throw new Error('Empty formula');
  const tokens = tokenize(formula.replace(/\s+/g, ''));
  if (tokens.length === 0) throw new Error('Invalid formula');
  const { counts } = parseTokens(tokens, 0);
  const result: ParsedAtom[] = [];
  for (const [sym, count] of Object.entries(counts)) {
    const mass = symbolMass[sym];
    if (mass == null) throw new Error(`Unknown element: ${sym}`);
    result.push({ symbol: sym, count, atomicMass: mass });
  }
  if (result.length === 0) throw new Error('No elements recognized');
  return result;
};

export const molarMass = (formula: string): number => {
  return parseFormula(formula).reduce((s, p) => s + p.count * p.atomicMass, 0);
};
