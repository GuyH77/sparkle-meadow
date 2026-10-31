import Phaser from 'phaser';
import { Fact, stage } from '../engine';
import { RoundScene } from '../round';
import { save, sized, text, W } from '../ui';

const ACORN = 50;

/** Up to 10 counters in rows of up to 4, centred on (cx, cy). */
function spots(n: number, cx: number, cy: number, step = 56) {
  const rows = Math.ceil(n / 4);
  return [...Array(n)].map((_, i) => {
    const r = Math.floor(i / 4), inRow = Math.min(4, n - r * 4);
    return { x: cx + ((i % 4) - (inRow - 1) / 2) * step, y: cy + (r - (rows - 1) / 2) * step };
  });
}

/**
 * Cherry Split (part-whole model): a big "whole" cherry joined to two "part" cherries.
 *  part mode:  whole t, one part a, find the other part
 *  whole mode: parts a and b, find the whole
 * Stage 0 shows acorns in the cherries, stage 1 numbers + acorns, stage 2 numbers only.
 */
export class CherryScene extends RoundScene {
  bg = 'bg-clearing';
  private introDone = false;
  constructor() { super('cherry'); }

  begin() { this.introDone = false; this.next(); }

  ask([t, a]: Fact) {
    const b = t - a, st = stage(save, t, a), L = this.layer, whole = this.cfg.mode === 'whole';
    const W0 = { x: W / 2, y: 330, r: 160 }, P1 = { x: W / 2 - 250, y: 640, r: 125 }, P2 = { x: W / 2 + 250, y: 640, r: 125 };

    const g = this.add.graphics();
    g.lineStyle(14, 0x6b8e3a);
    [P1, P2].forEach(p => g.lineBetween(W0.x, W0.y + W0.r - 10, p.x, p.y - p.r + 10));
    L.add(g);
    const cherry = (c: typeof W0, colour: number) => {
      L.add(this.add.circle(c.x + 6, c.y + 8, c.r, 0x000000, 0.15));
      L.add(this.add.circle(c.x, c.y, c.r, colour).setStrokeStyle(8, 0xffffff));
      L.add(this.add.ellipse(c.x - c.r * 0.45, c.y - c.r * 0.5, c.r * 0.35, c.r * 0.2, 0xffffff, 0.5).setAngle(-30));
    };
    cherry(W0, 0xf06a7e); cherry(P1, 0xff9fae); cherry(P2, 0xff9fae);

    const acorn = (x: number, y: number, px = ACORN) => sized(this, x, y, 'acorn', px);
    const fill = (c: typeof W0, n: number, numberY: number) => {
      if (st < 2) spots(n, c.x, c.y + (st === 1 ? 30 : 0), st === 1 ? 46 : 56).forEach(p => L.add(acorn(p.x, p.y, st === 1 ? 40 : ACORN)));
      if (st > 0) L.add(text(this, c.x, c.y + numberY, String(n), st === 2 ? 110 : 70));
    };
    const missing = whole ? W0 : P2;
    const q = text(this, missing.x, missing.y, '?', 120);
    L.add(q);
    if (whole) { fill(P1, a, -50); fill(P2, b, -50); } else { fill(W0, t, -70); fill(P1, a, -50); }

    // where the "missing" counters come from, for hints and the counting demo
    const from = whole ? [...spots(a, P1.x, P1.y), ...spots(b, P2.x, P2.y)] : spots(t, W0.x, W0.y).slice(a);
    const to = whole ? spots(t, W0.x, W0.y) : spots(b, P2.x, P2.y);
    const marks: Phaser.GameObjects.Arc[] = [];
    const hint = () => from.forEach(p => {
      const m = this.add.circle(p.x, p.y, ACORN / 2 + 8).setStrokeStyle(5, 0xffd34d);
      marks.push(m); L.add(m);
      this.tweens.add({ targets: m, scale: 1.25, duration: 250, yoyo: true, repeat: 3 });
    });

    const prompts = [whole ? `cs_whole_${t}_${a}` : `cs_part_${t}_${a}`];
    if (!this.introDone) { prompts.unshift('cs_intro'); this.introDone = true; }
    this.options({
      fact: [t, a], answer: whole ? t : b, max: 10, count: st === 2 ? 4 : 3, y: 880, gap: 190,
      also: whole ? [a, b] : [a, t], prompt: prompts, rightLine: `bond_${t}_${a}`,
      hintLine: whole ? 'cs_hint' : 'cs_hint_part', hint,
      demo: () => {
        q.setAlpha(0.3);
        return this.countAloud(to.length, i => {
          const s = acorn(from[i % from.length].x, from[i % from.length].y); L.add(s);
          this.tweens.add({ targets: s, x: to[i].x, y: to[i].y, duration: 350, ease: 'Quad.out' });
        });
      },
      onRight: () => {
        q.setText(String(whole ? t : b));
        this.tweens.add({ targets: q, scale: { from: 1.6, to: 1 }, duration: 400, ease: 'Back.out' });
        marks.forEach(m => m.destroy());
      },
    });
  }
}
