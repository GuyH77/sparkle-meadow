import { answer, Fact } from '../engine';
import { RoundScene } from '../round';
import { pressable, randomLine, save, say, sfx, text, W, wobble } from '../ui';

const N = 20, D = 58, ROD_Y = 470, LEFT = W / 2 - 720, RIGHT = W / 2 + 720;
// rekenrek colours: five red, five white, five red, five white
const colour = (i: number) => (Math.floor(i / 5) % 2 === 0 ? 0xe2434f : 0xfaf3e6);

/**
 * Bead Slider (a 20-bead rekenrek). Tap a bead to slide it, and every bead before it, to the left.
 *  make mode (teens, fact [t, 10]):  "Show 13 on the beads", then tick.
 *  add mode (bridge, fact [t, a]):   a beads are already across; slide b more, then tick.
 */
export class BeadsScene extends RoundScene {
  bg = 'bg-river';
  private introDone = false;
  constructor() { super('beads'); }

  begin() { this.introDone = false; this.next(); }

  ask([t, a]: Fact) {
    const make = this.cfg.mode === 'make', L = this.layer, t0 = Date.now();
    const start = make ? 0 : a;
    let count = start, wrong = 0;

    L.add(this.add.rectangle(W / 2, ROD_Y, RIGHT - LEFT + 60, 14, 0x8a5a3c).setStrokeStyle(3, 0x5e3b25));
    L.add(this.add.rectangle(LEFT - 40, ROD_Y, 26, 120, 0x8a5a3c));
    L.add(this.add.rectangle(RIGHT + 40, ROD_Y, 26, 120, 0x8a5a3c));
    L.add(text(this, W / 2, 230, make ? String(t) : `${a} + ${t - a}`, 130));

    const beads = [...Array(N)].map((_, i) => {
      const b = this.add.container(0, ROD_Y);
      b.add(this.add.circle(3, 5, D / 2, 0x000000, 0.2));
      b.add(this.add.circle(0, 0, D / 2, colour(i)).setStrokeStyle(3, 0x7a5a48));
      b.add(this.add.circle(-9, -10, 8, 0xffffff, 0.6));
      b.setSize(D, D).setInteractive({ useHandCursor: true }).on('pointerup', () => {
        count = i < count ? i : i + 1;
        sfx.tap(this);
        layout();
      });
      L.add(b);
      return b;
    });
    const xOf = (i: number) => (i < count ? LEFT + D / 2 + i * D : RIGHT - D / 2 - (N - 1 - i) * D);
    const layout = (instant = false) => beads.forEach((b, i) =>
      instant ? b.setX(xOf(i)) : this.tweens.add({ targets: b, x: xOf(i), duration: 180, ease: 'Quad.out' }));
    layout(true);

    const glow = (from: number, to: number) => beads.slice(from, to).forEach(b =>
      this.tweens.add({ targets: b, y: ROD_Y - 26, duration: 200, yoyo: true, repeat: 2 }));

    const tick = this.add.container(W / 2, 780);
    tick.add(this.add.circle(0, 6, 80, 0x000000, 0.15));
    tick.add(this.add.circle(0, 0, 80, 0x7ccf5e).setStrokeStyle(8, 0xffffff));
    tick.add(text(this, 0, 4, '✓', 96, '#ffffff'));
    tick.setSize(160, 160);
    L.add(tick);
    pressable(tick, this, () => {
      if (count === t) {
        tick.disableInteractive();
        beads.forEach(b => b.disableInteractive());
        if (wrong === 0) answer(save, t, a, true, Date.now() - t0);
        glow(0, t);
        return this.right(make ? `bond_${t}_10` : `add_${t}_${a}`, wrong > 0);
      }
      wrong++; this.wrongTotal++;
      if (wrong === 1) answer(save, t, a, false, Date.now() - t0);
      sfx.boop(this); this.pet.tilt(); wobble(this, tick);
      if (wrong === 1) { say(this, randomLine('oops', 3), 'bd_hint'); glow(0, Math.min(10, t)); return; }
      // second miss: the pet slides them across, counting the beads that are being added
      count = start; layout();
      this.input.enabled = false;
      void (async () => {
        await say(this, 'watch_me');
        for (let k = start; k < t; k++) { count = k + 1; layout(); sfx.drop(this); await say(this, `num_${make ? k + 1 : k - start + 1}`); }
        this.input.enabled = true;
        this.tweens.add({ targets: tick, scale: 1.15, duration: 400, yoyo: true, repeat: -1 });
      })();
    });

    const lines = [make ? `bd_make_${t}` : `bd_add_${t}_${a}`];
    if (!this.introDone) { lines.push('bd_intro', 'bd_check'); this.introDone = true; }
    say(this, ...lines);
  }
}
