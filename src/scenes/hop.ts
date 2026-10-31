import Phaser from 'phaser';
import { Fact, SKILLS, stage } from '../engine';
import { RoundScene } from '../round';
import { save, say, sfx, text, W } from '../ui';

const LINE_Y = 600;

/**
 * Pet Hop: the pet hops along stepping stones numbered 0-10.
 *  add mode: start at a, hop forward b, land on t      (fact [t, a])
 *  sub mode: start at t, hop back a, land on t - a     (fact [t, a])
 * Stage 0: she taps the pet to make each hop, then says where it landed.
 * Stage 1: the line is there, she works it out. Stage 2: just the sum; the line comes back as a hint.
 */
export class HopScene extends RoundScene {
  bg = 'bg-river';
  private hopper!: Phaser.GameObjects.Image;
  private shownTap = false;
  constructor() { super('hop'); }

  begin() {
    this.pet.img.setVisible(false); // the pet is on the stones in this game
    this.shownTap = false;
    this.next();
  }

  ask([t, a]: Fact) {
    // 0-10 line, or 0-20 (smaller stones) when the skill goes past ten
    const max = SKILLS[this.cfg.skill].facts.some(f => f[0] > 10) ? 20 : 10;
    const STEP = max === 20 ? 66 : 120, X0 = W / 2 - (max * STEP) / 2, k = max === 20 ? 0.6 : 1;
    const stoneX = (n: number) => X0 + n * STEP;
    const add = this.cfg.mode !== 'sub';
    const start = add ? a : t, hops = add ? t - a : a, land = add ? t : t - a, dir = add ? 1 : -1;
    const st = stage(save, t, a), L = this.layer;

    const line = this.add.container(0, 0);
    L.add(line);
    for (let n = 0; n <= max; n++) {
      line.add(this.add.ellipse(stoneX(n), LINE_Y + 10, 104 * k, 46, 0x000000, 0.18));
      // stones 0-10 grey, 11-20 sandy, so ten stands out
      line.add(this.add.ellipse(stoneX(n), LINE_Y, 104 * k, 50, n > 10 ? 0xe8d6b0 : 0xd9d2c3).setStrokeStyle(5, n === 10 ? 0xf2b705 : 0xa89f8c));
      line.add(text(this, stoneX(n), LINE_Y + 70, String(n), 52 * Math.max(k, 0.75)));
    }
    this.hopper?.destroy();
    const h = this.hopper = this.add.image(stoneX(start), LINE_Y - 10, `pet-${save.pet ?? 'fox'}`).setOrigin(0.5, 1).setDepth(20);
    h.setScale((max === 20 ? 130 : 170) / h.height).setFlipX(!add);
    let at = start;

    const arcs = this.add.graphics().setDepth(15);
    L.add(arcs);
    const drawArc = (from: number) => {
      arcs.lineStyle(6, 0xffd34d);
      const c = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(stoneX(from), LINE_Y - 30),
        new Phaser.Math.Vector2((stoneX(from) + stoneX(from + dir)) / 2, LINE_Y - 150 * k), new Phaser.Math.Vector2(stoneX(from + dir), LINE_Y - 30));
      c.draw(arcs);
    };
    const hopOnce = () => new Promise<void>(res => {
      drawArc(at);
      at += dir;
      sfx.tap(this);
      this.tweens.add({ targets: h, x: stoneX(at), duration: 380, ease: 'Linear' });
      this.tweens.add({ targets: h, y: LINE_Y - 130, duration: 190, yoyo: true, ease: 'Quad.out', onComplete: () => { sfx.drop(this); res(); } });
    });

    let sum: Phaser.GameObjects.Text | undefined;
    if (st === 2) { line.setAlpha(0.15); h.setAlpha(0); sum = text(this, W / 2, 330, `${start} ${add ? '+' : '−'} ${hops} = ?`, 140); L.add(sum); }

    const showCards = (prompt?: string) => this.options({
      fact: [t, a], answer: land, max, count: st === 2 ? 4 : 3, y: 860, prompt,
      also: [start, land - dir], rightLine: add ? `add_${t}_${a}` : `sub_${t}_${a}`, hintLine: 'hop_hint',
      hint: () => {
        sum?.setY(200);
        this.tweens.add({ targets: [line, h], alpha: 1, duration: 300 });
        for (let i = 0, f = start; i < hops; i++, f += dir) drawArc(f);
      },
      demo: async () => {
        arcs.clear(); at = start; h.setX(stoneX(start));
        await say(this, 'watch_me');
        for (let i = 0; i < hops; i++) { await hopOnce(); await say(this, `num_${i + 1}`); }
      },
      onRight: () => {
        if (at === land) return;
        this.tweens.add({ targets: h, alpha: 1, duration: 200 });
        const go = () => { if (at !== land) hopOnce().then(go); };
        go();
      },
    });

    const prompt = add ? `hop_add_${t}_${a}` : `hop_sub_${t}_${a}`;
    if (st > 0) { showCards(prompt); return; }

    // concrete: hop counter dots; each tap on the pet (or anywhere on the river) is one hop
    const counter = [...Array(hops)].map((_, i) => this.add.circle(W / 2 + (i - (hops - 1) / 2) * 56, 230, 20, 0xffffff).setStrokeStyle(5, 0xffd34d));
    L.add(counter);
    L.add(text(this, W / 2, 160, add ? 'hop forward' : 'hop back', 54));
    say(this, ...(this.shownTap ? [prompt] : [prompt, 'hop_tap']));
    this.shownTap = true;
    let done = 0, busy = false;
    const zone = this.add.zone(W / 2, LINE_Y - 60, W, 420).setInteractive({ useHandCursor: true });
    L.add(zone);
    zone.on('pointerup', () => {
      if (busy || done >= hops) return;
      busy = true;
      counter[done].setFillStyle(0xffd34d);
      void say(this, `num_${done + 1}`);
      hopOnce().then(() => {
        busy = false;
        if (++done === hops) { zone.disableInteractive(); this.time.delayedCall(500, () => showCards()); }
      });
    });
  }
}
