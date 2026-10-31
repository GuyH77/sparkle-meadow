// Adaptive learning engine: per-fact Leitner boxes, weighted question picking, CPA stage per fact.

/**
 * A fact is a number-bond family member [total, part]: part + other = total.
 * One record covers the whole family (3 + 7 = 10, 10 - 3 = 7, 7 + ? = 10 ...).
 */
export type Fact = [total: number, part: number];
export type Skill = { id: string; facts: Fact[] };

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const bonds = (t: number): Fact[] => range(0, t).map(a => [t, a]);

export const SKILLS: Record<string, Skill> = {
  bonds5: { id: 'bonds5', facts: bonds(5) },
  bonds10: { id: 'bonds10', facts: bonds(10) },
  within10: { id: 'within10', facts: range(3, 10).flatMap(t => range(1, t - 1).map(a => [t, a] as Fact)) },
  oneMore: { id: 'oneMore', facts: range(1, 10).map(t => [t, t - 1] as Fact) },   // (t-1) + 1 = t
  oneLess: { id: 'oneLess', facts: range(1, 10).map(t => [t, 1] as Fact) },       // t - 1 = t-1
  bonds20: { id: 'bonds20', facts: bonds(20) },
  teens: { id: 'teens', facts: range(11, 19).map(t => [t, 10] as Fact) },          // 10 + u = t
  // a + b crossing ten, e.g. 8 + 5: a 5..9, b 2..9, total 11..18
  bridge: { id: 'bridge', facts: range(5, 9).flatMap(a => range(2, 9).filter(b => a + b > 10 && a + b <= 18).map(b => [a + b, a] as Fact)) },
  doubles: { id: 'doubles', facts: range(1, 10).map(n => [2 * n, n] as Fact) },    // n + n = 2n (and half of 2n)
  nearDoubles: { id: 'nearDoubles', facts: range(1, 9).map(n => [2 * n + 1, n] as Fact) }, // n + (n+1)
};

/** One fact = "a + ? = total". box 0 (new/shaky) .. 5 (fluent). */
export type FactRecord = { box: number; seen: number; right: number; ms: number };
export type Save = {
  pet: string | null;
  nodes: Record<string, number>;        // node id -> best stars (1-3)
  facts: Record<string, FactRecord>;    // "total:a" -> record
  playMs: number;                       // total time in mini-games
  muted: boolean;
  gems: number;                         // earned from stars, spent on decorations
  decor: { id: string; x: number; y: number }[];  // decorations placed in the sanctuary
  lastGift: string;                     // date (YYYY-MM-DD) of the last daily gift
  limitMin: number;                     // session time limit in minutes, 0 = off
  unlockTo: number;                     // grown-ups can open realms up to this index without finishing earlier ones
};

export const MAX_BOX = 5;
export const FAST_MS = 4000;              // correct and under this = promote
const KEY = 'sanctuary-v2';

export const factKey = (total: number, a: number) => `${total}:${a}`;

export function fresh(): Save { return { pet: null, nodes: {}, facts: {}, playMs: 0, muted: false, gems: 0, decor: [], lastGift: '', limitMin: 0, unlockTo: 0 }; }

export function load(): Save {
  try { return { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return fresh(); }
}
export function persist(s: Save) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode */ } }

export function record(s: Save, total: number, a: number): FactRecord {
  return s.facts[factKey(total, a)] ??= { box: 0, seen: 0, right: 0, ms: 0 };
}

/** Concrete (0) -> Pictorial (1) -> Abstract (2), driven by how secure the fact is. */
export function stage(s: Save, total: number, a: number): 0 | 1 | 2 {
  const box = s.facts[factKey(total, a)]?.box ?? 0;
  return box <= 1 ? 0 : box <= 3 ? 1 : 2;
}

/** Update a fact after an answer. helped = a hint was shown, so no promotion. */
export function answer(s: Save, total: number, a: number, correct: boolean, ms: number, helped = false) {
  const r = record(s, total, a);
  r.seen++;
  r.ms = r.seen === 1 ? ms : Math.round(r.ms * 0.7 + ms * 0.3);
  if (correct) {
    r.right++;
    if (!helped && ms < FAST_MS) r.box = Math.min(MAX_BOX, r.box + 1);
  } else {
    r.box = Math.max(0, r.box - 2);
  }
}

/**
 * Pick n facts from a skill. Shaky facts are weighted up ((6-box)^2: box 0 is 36x a fluent fact),
 * no immediate repeats. ponytail: weighted random, not a full spaced-repetition scheduler; add due-dates
 * once there are enough skills for cross-session review to matter.
 */
export function pick(s: Save, skill: Skill, n: number, rand = Math.random): Fact[] {
  const out: Fact[] = [];
  for (let i = 0; i < n; i++) {
    const last = out[out.length - 1];
    const options = skill.facts.filter(f => skill.facts.length < 2 || !last || f[0] !== last[0] || f[1] !== last[1]);
    const w = options.map(([t, a]) => (MAX_BOX + 1 - (s.facts[factKey(t, a)]?.box ?? 0)) ** 2);
    let r = rand() * w.reduce((x, y) => x + y, 0);
    out.push(options.find((_, j) => (r -= w[j]) < 0) ?? options[options.length - 1]);
  }
  return out;
}

/** Answer cards: the answer plus near-miss distractors, all within 0..max, shuffled. */
export function choices(answer: number, max: number, count: number, rand = Math.random, also: number[] = []): number[] {
  const near = [...also, answer - 1, answer + 1, answer - 2, answer + 2, answer + 3, answer - 3, answer + 4, answer - 4]
    .filter((v, i, arr) => v >= 0 && v <= max && v !== answer && arr.indexOf(v) === i);
  const set = [answer, ...near.slice(0, count - 1)];
  for (let i = set.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [set[i], set[j]] = [set[j], set[i]]; }
  return set;
}

export function stars(wrong: number): number { return wrong <= 1 ? 3 : wrong <= 3 ? 2 : 1; }

/** Gems for finishing a stop: one per star, a bonus for bosses, and only the improvement on a replay. */
export function gemsFor(newStars: number, oldStars: number, boss: boolean): number {
  return Math.max(0, newStars - oldStars) + (boss && !oldStars ? 3 : 0) + 1;
}
