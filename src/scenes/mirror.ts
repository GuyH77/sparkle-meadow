import Phaser from 'phaser';
import { Fact, stage } from '../engine';
import { RoundScene } from '../round';
import { pressable, save, say, sfx, text, W } from '../ui';

const CX = W / 2, CY = 400;
// spot positions on the LEFT wing, relative to the body; the right wing mirrors x
const SPOTS = [[-150, -90], [-250, -60], [-200, -150], [-110, -20], [-300, -130], [-170, 70], [-250, 110], [-120, 120], [-200, 10], [-320, 20]];

/**
 * Butterfly Doubles (fact [2n, n]).
 *  double mode: one wing has n spots; tap the mirror and they copy across -> how many altogether?
 *  half mode:   both wings have n spots (2n in all); tap the mirror to fold -> how many on one wing?
 * Stage 2 shows only the sum; the butterfly comes back as a hint.
 */
export class MirrorScene extends RoundScene {
  bg = 'bg-alpine';
  private introDone = false;
  constructor() { super('mirror'); }

  begin() { this.introDone = false; this.next(); }

  ask([t, n]: Fact) {
    const half = this.cfg.mode === 'half', st = stage(save, t, n), L = this.layer;
    const fly = this.add.container(CX, CY);
    L.add(fly);
    const wing = (side: 1 | -1) => {
      const g = this.add.graphics();
      g.fillStyle(0xffb3c7).lineStyle(8, 0xd9668a);
      g.fillEllipse(side * 200, -70, 330, 250).strokeEllipse(side * 200, -70, 330, 250);
      g.fillEllipse(side * 165, 90, 250, 190).strokeEllipse(side * 165, 90, 250, 190);
      return g;
    };
    const left = wing(-1), right = wing(1);
    fly.add([left, right]);
    fly.add(this.add.ellipse(0, 10, 50, 300, 0x6b4a3a));
    fly.add(this.add.circle(0, -165, 32, 0x6b4a3a));
    const g = this.add.graphics().lineStyle(4, 0x6b4a3a);
    g.lineBetween(-10, -190, -50, -250).lineBetween(10, -190, 50, -250);
    fly.add(g);
    this.tweens.add({ targets: [left, right], scaleY: 0.96, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const spot = (x: number, y: number) => this.add.circle(x, y, 26, 0x7a3bd1).setStrokeStyle(4, 0xffffff);
    const leftSpots = SPOTS.slice(0, n).map(([x, y]) => spot(x, y));
    fly.add(leftSpots);
    const rightSpots: Phaser.GameObjects.Arc[] = [];
    const copyAcross = (animate: boolean) => SPOTS.slice(0, n).forEach(([x, y], i) => {
      const s = spot(animate ? x : -x, y);
      fly.add(s); rightSpots.push(s);
      if (animate) this.tweens.add({ targets: s, x: -x, duration: 500, delay: i * 60, ease: 'Quad.inOut' });
    });
    if (half || st > 0) copyAcross(false);

    let sum: Phaser.GameObjects.Text | undefined;
    if (st === 2) { fly.setAlpha(0.12); sum = text(this, CX, 300, half ? `half of ${t} = ?` : `${n} + ${n} = ?`, 120); L.add(sum); }

    const show = () => { sum?.destroy(); this.tweens.add({ targets: fly, alpha: 1, duration: 300 }); };
    const counted = () => (half ? leftSpots : [...leftSpots, ...rightSpots]);
    const askCards = () => this.options({
      fact: [t, n], answer: half ? n : t, max: 20, count: st === 2 ? 4 : 3, y: 860, also: half ? [t, n + 1] : [n, t + 2],
      prompt: half ? `half_q_${n}` : `mr_q_${n}`, rightLine: half ? `half_${n}` : `dbl_${n}`,
      hintLine: half ? 'mr_half_hint' : 'mr_hint',
      hint: () => { show(); counted().forEach(s => this.tweens.add({ targets: s, scale: 1.3, duration: 250, yoyo: true, repeat: 3 })); },
      demo: () => { show(); const c = counted(); return this.countAloud(c.length, i => this.tweens.add({ targets: c[i], scale: 1.5, duration: 200, yoyo: true })); },
    });

    if (st > 0) { askCards(); return; }

    // concrete: she taps the mirror to copy (double) or fold (half)
    const mirror = this.add.container(CX, CY + 250);
    mirror.add(this.add.circle(0, 0, 62, 0xd6f0ff).setStrokeStyle(8, 0xffffff));
    mirror.add(text(this, 0, 2, '🪞', 60));
    mirror.setSize(124, 124);
    L.add(mirror);
    this.tweens.add({ targets: mirror, scale: 1.12, duration: 500, yoyo: true, repeat: -1 });
    pressable(mirror, this, () => {
      mirror.destroy();
      sfx.sparkle(this);
      // fold: the right wing flips over onto the left one, so only one wing's spots are left to count
      if (half) {
        this.tweens.add({ targets: right, scaleX: -1, duration: 700, ease: 'Quad.inOut' });
        this.tweens.add({ targets: rightSpots, x: (_: unknown, __: string, v: number) => -v, duration: 700, ease: 'Quad.inOut',
          onComplete: () => { rightSpots.forEach(s => s.setVisible(false)); right.setVisible(false); askCards(); } });
      }
      else { copyAcross(true); this.time.delayedCall(n * 60 + 700, askCards); }
    });
    if (!this.introDone) { this.introDone = true; say(this, 'mr_intro'); }
  }

}
