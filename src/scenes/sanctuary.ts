import Phaser from 'phaser';
import { cover, FONT, H, homeButton, INK, Pet, roundButton, save, say, sfx, text, W } from '../ui';
import { ALL_NODES, realmOf } from '../world';

// where each rescued animal lives in the yard (same order as ALL_NODES)
const SLOTS = [
  [520, 700], [760, 660], [1000, 690], [1240, 660], [1450, 720], [640, 850],
  [880, 900], [1120, 860], [1360, 900], [420, 920], [1500, 900], [300, 760],
];
const NAMES: Record<string, string> = { bearcub: 'bear cub' };

/** The sanctuary yard: every rescued animal wanders about; tap one to hear it say hello. Plus the sticker book. */
export class SanctuaryScene extends Phaser.Scene {
  constructor() { super('sanctuary'); }

  create() {
    this.cameras.main.fadeIn(400, 255, 250, 240);
    cover(this, 'bg-sanctuary');
    homeButton(this);
    roundButton(this, W - 80, 80, '📖', () => this.book());
    new Pet(this, 200, H - 40, 240).img.setDepth(30);

    ALL_NODES.forEach((n, i) => {
      if (!save.nodes[n.id]) return;
      const [x, y] = SLOTS[i % SLOTS.length];
      const a = this.add.image(x, y, `animal-${n.animal}`).setOrigin(0.5, 1).setDepth(y);
      a.setScale(150 / a.height);
      const s = a.scale;
      // wander: amble a little way, turn round, amble back
      this.tweens.add({ targets: a, x: x + Phaser.Math.Between(50, 110), duration: Phaser.Math.Between(2500, 4000), yoyo: true, repeat: -1,
        ease: 'Sine.inOut', delay: Math.random() * 1500, onYoyo: () => a.setFlipX(true), onRepeat: () => a.setFlipX(false) });
      this.tweens.add({ targets: a, scaleY: s * 1.05, duration: 400, yoyo: true, repeat: -1 });
      a.setInteractive({ useHandCursor: true }).on('pointerup', () => {
        sfx.pop(this);
        this.tweens.add({ targets: a, y: y - 70, duration: 220, yoyo: true, ease: 'Quad.out' });
        say(this, `hi_${n.animal}`);
      });
    });
    this.time.delayedCall(400, () => say(this, 'sanctuary_hi'));
  }

  /** Sticker book: every animal in the game; ones still to rescue are silhouettes. */
  private book() {
    const layer = this.add.container(0, 0).setDepth(5000); // above the animals, whose depth is their y
    layer.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.45).setInteractive());
    const page = this.add.graphics();
    page.fillStyle(0xfff8ec).fillRoundedRect(140, 90, W - 280, H - 180, 40).lineStyle(10, 0xc98a4b).strokeRoundedRect(140, 90, W - 280, H - 180, 40);
    layer.add(page);
    layer.add(text(this, W / 2, 160, 'My Sticker Book', 72));
    ALL_NODES.forEach((n, i) => {
      const x = 330 + (i % 6) * 188, y = 380 + Math.floor(i / 6) * 330, got = !!save.nodes[n.id];
      layer.add(this.add.circle(x, y, 82, got ? 0xfff0b3 : 0xeeeeee).setStrokeStyle(6, got ? 0xf2b705 : 0xcccccc));
      const img = this.add.image(x, y, `animal-${n.animal}`);
      img.setScale(130 / Math.max(img.width, img.height));
      if (!got) img.setTintFill(0xbdb5ad).setAlpha(0.6);
      layer.add(img);
      layer.add(this.add.text(x, y + 112, got ? (NAMES[n.animal] ?? n.animal) : '?', {
        fontFamily: FONT, fontSize: '34px', fontStyle: '600', color: INK }).setOrigin(0.5));
      layer.add(this.add.text(x, y + 150, realmOf(n.id).id === 'meadow' ? '🌼' : '🌲', { fontSize: '28px' }).setOrigin(0.5));
    });
    const close = roundButton(this, W - 170, 130, '✖️', () => layer.destroy(), 46);
    layer.add(close);
    say(this, 'book_hi');
  }
}
