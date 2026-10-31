import { expect, test } from 'vitest';
import { answer, choices, fresh, gemsFor, pick, SKILLS, stage } from './engine';

test('facts climb through CPA stages with fast correct answers and drop on mistakes', () => {
  const s = fresh();
  expect(stage(s, 10, 3)).toBe(0);
  for (let i = 0; i < 4; i++) answer(s, 10, 3, true, 1500);
  expect(stage(s, 10, 3)).toBe(2);
  answer(s, 10, 3, true, 9000);           // slow: no promotion
  answer(s, 10, 3, true, 1000, true);     // helped: no promotion
  expect(s.facts['10:3'].box).toBe(4);
  answer(s, 10, 3, false, 2000);
  expect(s.facts['10:3'].box).toBe(2);
  expect(stage(s, 10, 3)).toBe(1);
});

test('pick favours shaky facts, stays inside the skill and never repeats back-to-back', () => {
  const s = fresh();
  for (let a = 0; a <= 10; a++) if (a !== 7) s.facts[`10:${a}`] = { box: 5, seen: 9, right: 9, ms: 900 };
  const picks = pick(s, SKILLS.bonds10, 400);
  expect(picks.filter(([, a]) => a === 7).length).toBeGreaterThan(150); // weight 36 vs 1 each, minus no-repeat rule
  picks.forEach((f, i) => expect(f).not.toEqual(picks[i - 1]));
  picks.forEach(([t, a]) => expect(t === 10 && a >= 0 && a <= 10).toBe(true));
  for (const [t, a] of pick(s, SKILLS.within10, 200)) expect(t >= 3 && t <= 10 && a >= 1 && a < t).toBe(true);
});

test('choices contain the answer once, stay in range, and are unique', () => {
  for (const max of [5, 10]) for (let ans = 0; ans <= max; ans++) {
    const c = choices(ans, max, 4, Math.random, [max - ans]);
    expect(c.filter(v => v === ans)).toHaveLength(1);
    expect(new Set(c).size).toBe(c.length);
    c.forEach(v => expect(v >= 0 && v <= max).toBe(true));
    expect(c.length).toBe(4);
  }
});

test('new skills stay in range', () => {
  for (const [t, a] of SKILLS.bridge.facts) expect(a < 10 && t > 10 && t <= 18 && t - a <= 9).toBe(true);
  for (const [t, a] of SKILLS.nearDoubles.facts) expect(t - a).toBe(a + 1);
  for (const [t, a] of SKILLS.teens.facts) expect(a === 10 && t > 10 && t < 20).toBe(true);
});

test('gems: one per new star plus one for playing, boss bonus only the first time', () => {
  expect(gemsFor(3, 0, false)).toBe(4);
  expect(gemsFor(2, 3, false)).toBe(1);
  expect(gemsFor(3, 0, true)).toBe(7);
  expect(gemsFor(3, 2, true)).toBe(2);
});
