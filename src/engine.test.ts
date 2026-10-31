import { expect, test } from 'vitest';
import { answer, choices, fresh, pick, SKILLS, stage } from './engine';

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

test('pick favours shaky facts and never repeats back-to-back', () => {
  const s = fresh();
  for (let a = 0; a <= 10; a++) if (a !== 7) s.facts[`10:${a}`] = { box: 5, seen: 9, right: 9, ms: 900 };
  const picks = pick(s, SKILLS.bonds10, 400);
  expect(picks.filter(a => a === 7).length).toBeGreaterThan(150); // weight 36 vs 1 each, minus no-repeat rule
  picks.forEach((a, i) => expect(a).not.toBe(picks[i - 1]));
  picks.forEach(a => expect(a >= 0 && a <= 10).toBe(true));
});

test('choices contain the answer once, stay in range, and are unique', () => {
  for (let total of [5, 10]) for (let ans = 0; ans <= total; ans++) {
    const c = choices(ans, total, 4);
    expect(c.filter(v => v === ans)).toHaveLength(1);
    expect(new Set(c).size).toBe(c.length);
    c.forEach(v => expect(v >= 0 && v <= total).toBe(true));
    expect(c.length).toBe(4);
  }
});
