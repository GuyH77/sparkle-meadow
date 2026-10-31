import Phaser from 'phaser';
import { answer, Fact, stage } from '../engine';
import { RoundScene } from '../round';
import { burst, commit, H, save, say, sfx, text, W, wobble } from '../ui';

const SIZE = 190, ON_SCREEN_PAIRS = 4;

type Bubble = Phaser.GameObjects.Container & { n: number; baseX: number; phase: number; speed: number; misses: number };

/**
 * Bubble Pairs: numbered bubbles float up; pop two that make the total.
 * Bubbles always spawn as complementary pairs, and only complementary pairs are removed,
 * so every bubble on screen always has a partner.
 */
export class BubblesScene extends RoundScene {
  bg = 'bg-pond';
  private bubbles: Bubble[] = [];
  private selected: Bubble | null = null;
  private selectedAt = 0;
  private found = 0;
  private total = 10;

  constructor() { super('bubbles'); }

  goal() { return this.node.parts ? 3 : 6; }
  count() { return this.goal() + ON_SCREEN_PAIRS; }
  ask() { /* bubbles run continuously, see begin() */ }

  begin() {
    this.bubbles = []; this.selected = null; this.found = 0;
    this.total = this.queue[0]?.[0] ?? 10;
    for (let i = 0; i < ON_SCREEN_PAIRS; i++) this.spawnPair(H * 0.25 + i * 190);
    this.time.delayedCall(400, () => say(this, `bb_intro_${this.total}`));
  }

  private lanes = [380, 560, 740, 920, 1100, 1280, 1440, 470, 830, 1190];
  private spawnPair(y0?: number) {
    if (!this.queue.length) return;
    // prefer a pair that isn't already floating about (two 0+10 pairs at once is dull)
    const on = new Set(this.bubbles.map(b => b.n)), total = this.total;
    const i = this.queue.findIndex(([, a]) => !on.has(a) && !on.has(total - a));
    const [, a] = this.queue.splice(Math.max(0, i), 1)[0] as Fact;
    [a, total - a].forEach((n, k) => {
      const free = this.lanes.filter(x => !this.bubbles.some(b => Math.abs(b.baseX - x) < 120 && Math.abs(b.y - (y0 ?? H + 120)) < 260));
      const x = Phaser.Utils.Array.GetRandom(free.length ? free : this.lanes);
      this.makeBubble(n, x, (y0 ?? H + 120) + k * 140 + Phaser.Math.Between(0, 80));
    });
  }

  private makeBubble(n: number, x: number, y: number) {
    const b = this.add.container(x, y) as Bubble;
    b.add(this.add.image(0, 0, 'bubble').setDisplaySize(SIZE, SIZE));
    b.add(text(this, 0, n === 10 ? -6 : -10, String(n), 92));
    // concrete support: shaky facts show a dot pattern under the numeral
    if (stage(save, this.total, n) === 0 && n > 0) {
      for (let i = 0; i < n; i++) b.add(this.add.circle(((i % 5) - 2) * 18, 46 + Math.floor(i / 5) * 18, 7, 0xff6b9a));
    }
    Object.assign(b, { n, baseX: x, phase: Math.random() * Math.PI * 2, speed: Phaser.Math.Between(38, 55), misses: 0 });
    b.setSize(SIZE, SIZE).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.tap(b));
    b.setScale(0);
    this.tweens.add({ targets: b, scale: 1, duration: 400, ease: 'Back.out' });
    this.bubbles.push(b);
  }

  update(_: number, dt: number) {
    const t = this.time.now / 1000, bs = this.bubbles;
    // gently push overlapping bubbles apart sideways
    for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
      const dx = bs[i].x - bs[j].x, dy = bs[i].y - bs[j].y;
      if (dx * dx + dy * dy < SIZE * SIZE) {
        const push = (dx >= 0 ? 1 : -1) * dt * 0.12;
        bs[i].baseX = Phaser.Math.Clamp(bs[i].baseX + push, 300, W - 160);
        bs[j].baseX = Phaser.Math.Clamp(bs[j].baseX - push, 300, W - 160);
      }
    }
    for (const b of bs) {
      if (b === this.selected) continue; // the selected bubble waits for its partner
      b.y -= (b.speed * dt) / 1000;
      b.x = b.baseX + Math.sin(t * 0.8 + b.phase) * 30;
      if (b.y < -SIZE) b.y = H + SIZE / 2 + Math.random() * 120;
    }
  }

  private highlight(b: Bubble, on: boolean) {
    this.tweens.killTweensOf(b);
    this.tweens.add({ targets: b, scale: on ? 1.2 : 1, duration: 180, ease: 'Back.out' });
    (b.list[0] as Phaser.GameObjects.Image).setTint(on ? 0xfff2a8 : 0xffffff);
  }

  private tap(b: Bubble) {
    if (!b.input?.enabled) return;
    const s = this.selected;
    if (!s) { this.selected = b; this.selectedAt = Date.now(); sfx.tap(this); this.highlight(b, true); return; }
    if (s === b) { this.selected = null; this.highlight(b, false); return; }

    const total = this.total;
    if (s.n + b.n === total) {
      this.selected = null;
      if (s.misses === 0) answer(save, total, s.n, true, Date.now() - this.selectedAt);
      return this.pop(s, b);
    }
    this.wrongTotal++;
    s.misses++;
    if (s.misses === 1) answer(save, total, s.n, false, Date.now() - this.selectedAt);
    sfx.boop(this); this.pet.tilt();
    wobble(this, b);
    if (s.misses >= 2) {
      const partner = this.bubbles.find(x => x !== s && x.n === total - s.n)!;
      say(this, 'bb_hint');
      this.tweens.add({ targets: partner, scale: 1.25, duration: 350, yoyo: true, repeat: 3 });
      if (partner.y < SIZE || partner.y > H - SIZE / 2) partner.y = H * 0.6; // bring it into view
    } else {
      say(this, 'bb_not');
    }
  }

  private pop(a: Bubble, b: Bubble) {
    [a, b].forEach(x => x.disableInteractive());
    this.bubbles = this.bubbles.filter(x => x !== a && x !== b);
    const mx = (a.x + b.x) / 2, my = Math.min(Math.max((a.y + b.y) / 2, 250), H - 250);
    this.tweens.add({
      targets: [a, b], x: mx, y: my, duration: 350, ease: 'Quad.in',
      onComplete: () => { sfx.pop(this); burst(this, mx, my, 30); [a, b].forEach(x => x.destroy()); },
    });
    this.tick();
    this.found++;
    this.pet.hop(2);
    sfx.ding(this);
    this.input.enabled = false;
    say(this, `bond_${this.total}_${a.n}`).then(() => {
      this.input.enabled = true;
      commit();
      if (this.found >= this.goal()) {
        this.bubbles.forEach(x => this.tweens.add({ targets: x, alpha: 0, duration: 400 }));
        return this.finish();
      }
      this.spawnPair();
    });
  }
}
