import Phaser from 'phaser';
import { Fact, stage } from '../engine';
import { RoundScene } from '../round';
import { pressable, save, sized, text, W } from '../ui';

const APPLE = 74;

/**
 * Feed the Animal: "I've got a apples, I want t". Pick the basket that makes t; it flies over and the
 * apples fill the gaps. Concrete: baskets show their apples. Pictorial: number + dots. Abstract: a sum.
 */
export class FeedScene extends RoundScene {
  bg = 'bg-orchard';
  constructor() { super('feed'); }

  ask([t, a]: Fact) {
    if (a === t) a = 0; // "I've got 10, I want 10" has an empty basket for an answer; ask 0 + 10 instead
    const b = t - a, st = stage(save, t, a), L = this.layer;
    const ax = W / 2 + 330, ay = 640;
    const animal = this.add.image(ax, ay, `animal-${this.node.animal}`).setOrigin(0.5, 1);
    animal.setScale(330 / animal.height);
    L.add(animal);
    this.tweens.add({ targets: animal, scaleY: animal.scaleY * 1.03, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // thought bubble: how many it wants
    const want = this.add.container(ax + 150, 210);
    want.add(this.add.circle(-95, 120, 14, 0xffffff).setStrokeStyle(4, 0xe2b98a));
    want.add(this.add.ellipse(0, 0, 220, 170, 0xffffff).setStrokeStyle(6, 0xe2b98a));
    want.add(text(this, -22, 0, String(t), 92));
    want.add(sized(this, 52, 6, 'apple', 64));
    L.add(want);

    // the animal's apples on a picnic blanket: a filled, (t - a) empty slots
    const bx = W / 2 - 230, by = 520, cols = 5, rows = Math.ceil(t / cols);
    const pile = this.add.container(0, 0);
    L.add(pile);
    pile.add(this.add.rectangle(bx, by, cols * (APPLE + 12) + 40, rows * (APPLE + 12) + 40, 0xffe3ea).setStrokeStyle(6, 0xf29bb2));
    const slot = (i: number) => ({ x: bx + ((i % cols) - (cols - 1) / 2) * (APPLE + 12), y: by + (Math.floor(i / cols) - (rows - 1) / 2) * (APPLE + 12) });
    const appleImg = (x: number, y: number) => sized(this, x, y, 'apple', APPLE);
    const ghosts: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < t; i++) {
      const { x, y } = slot(i);
      if (i < a) { const ap = appleImg(x, y - 200).setAlpha(0); pile.add(ap); this.tweens.add({ targets: ap, y, alpha: 1, delay: i * 60, duration: 300, ease: 'Bounce.out' }); }
      else { const g = this.add.circle(x, y, APPLE / 2 - 4).setStrokeStyle(4, 0xd88a9c).setAlpha(st === 0 ? 1 : 0); ghosts.push(g); pile.add(g); }
    }
    let sum: Phaser.GameObjects.Text | undefined;
    if (st === 2) { pile.setAlpha(0); sum = text(this, bx, by, `${a} + ? = ${t}`, 110); L.add(sum); }
    // hints bring the apples (and the empty slots) back into view
    const reveal = () => { sum?.destroy(); this.tweens.add({ targets: [pile, ...ghosts], alpha: 1, duration: 300 }); };
    this.options({
      fact: [t, a], answer: b, max: t, count: 3, gap: 270, y: 850, also: [a, t], prompt: `feed_${t}_${a}`,
      rightLine: `bond_${t}_${a}`, hintLine: 'feed_hint',
      hint: () => { reveal(); ghosts.forEach(g => { this.tweens.add({ targets: g, scale: 1.2, duration: 250, yoyo: true, repeat: 3 }); }); },
      demo: () => { reveal(); return this.countAloud(ghosts.length, i => { const g = ghosts[i]; pile.add(appleImg(g.x, g.y).setAlpha(0.6)); }); },
      onRight: () => {
        reveal();
        ghosts.forEach((g, i) => { const ap = appleImg(W / 2, 850).setAlpha(0); pile.add(ap); this.tweens.add({ targets: ap, x: g.x, y: g.y, alpha: 1, delay: 200 + i * 80, duration: 400, ease: 'Quad.out' }); });
        this.tweens.add({ targets: animal, y: ay - 60, duration: 200, yoyo: true, repeat: 2, delay: 300 });
      },
      make: (n, _i, x, onTap) => {
        const c = this.add.container(x, 850);
        const bk = this.add.image(0, 20, 'basket'); bk.setScale(220 / bk.width);
        c.add(bk);
        if (st === 0) for (let k = 0; k < n; k++) c.add(sized(this, ((k % 5) - 2) * 30, -40 - Math.floor(k / 5) * 26, 'apple', 40));
        if (st === 1) for (let k = 0; k < n; k++) c.add(this.add.circle(((k % 5) - 2) * 22, -40 - Math.floor(k / 5) * 22, 9, 0xe23d4f));
        c.add(text(this, 0, 60, String(n), 80));
        c.setSize(230, 220);
        pressable(c, this, () => onTap(c));
        return c;
      },
    });
  }
}
