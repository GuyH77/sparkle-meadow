import Phaser from 'phaser';
import { commit, cover, FONT, H, homeButton, INK, Pet, roundButton, save, say, sfx, sized, text, W, wobble } from '../ui';
import { ALL_NODES, realmOf } from '../world';

// where each rescued animal lives in the yard (same order as ALL_NODES): 4 staggered rows of 6
const SLOTS = [...Array(24)].map((_, i) => [400 + (i % 6) * 210 + (Math.floor(i / 6) % 2) * 100, 640 + Math.floor(i / 6) * 90]);
const NAMES: Record<string, string> = { bearcub: 'bear cub', goatkid: 'goat kid', cria: 'alpaca', redpanda: 'red panda', leopardcub: 'snow leopard' };
// things she can buy with gems to decorate the yard
const DECOR = [
  { id: 'flowerbed', cost: 3 }, { id: 'haybale', cost: 3 }, { id: 'bench', cost: 4 }, { id: 'sunflowers', cost: 4 },
  { id: 'birdhouse', cost: 5 }, { id: 'tree', cost: 6 }, { id: 'pond', cost: 6 }, { id: 'mushroomhouse', cost: 8 },
  { id: 'fountain', cost: 8 }, { id: 'windmill', cost: 10 },
];

/** The sanctuary yard: every rescued animal wanders about; tap one to hear it say hello. Plus the sticker book. */
export class SanctuaryScene extends Phaser.Scene {
  constructor() { super('sanctuary'); }

  create() {
    this.cameras.main.fadeIn(400, 255, 250, 240);
    cover(this, 'bg-sanctuary');
    homeButton(this);
    roundButton(this, W - 80, 80, '📖', () => this.book());
    roundButton(this, W - 220, 80, '🛒', () => this.shop());
    new Pet(this, 200, H - 40, 240).img.setDepth(30);
    const gc = this.add.container(260, 80).setDepth(40);
    gc.add([this.add.rectangle(20, 0, 170, 76, 0xffffff, 0.9).setStrokeStyle(5, 0x8fd3ff), sized(this, -30, 0, 'gem', 56)]);
    this.gemText = text(this, 45, 2, String(save.gems), 48);
    gc.add(this.gemText);
    save.decor.forEach(d => this.placeDecor(d));

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

  private gemText!: Phaser.GameObjects.Text;

  /** A bought decoration: sits in the yard (depth by y, like the animals); drag it to move it. */
  private placeDecor(d: { id: string; x: number; y: number }) {
    const img = sized(this, d.x, d.y, `deco-${d.id}`, 190).setOrigin(0.5, 1).setDepth(d.y);
    img.setInteractive({ draggable: true, useHandCursor: true });
    img.on('drag', (_: unknown, x: number, y: number) => img.setPosition(x, Phaser.Math.Clamp(y, 520, H - 10)).setDepth(img.y));
    img.on('dragend', () => { d.x = Math.round(img.x); d.y = Math.round(img.y); commit(); sfx.drop(this); });
    return img;
  }

  private shop() {
    const layer = this.add.container(0, 0).setDepth(5000);
    layer.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.45).setInteractive());
    const page = this.add.graphics();
    page.fillStyle(0xfff8ec).fillRoundedRect(140, 120, W - 280, H - 240, 40).lineStyle(10, 0x8fd3ff).strokeRoundedRect(140, 120, W - 280, H - 240, 40);
    layer.add(page);
    layer.add(text(this, W / 2, 190, 'Sanctuary Shop', 72));
    DECOR.forEach((item, i) => {
      const x = 330 + (i % 5) * 235, y = 380 + Math.floor(i / 5) * 280;
      const card = this.add.container(x, y);
      card.add(this.add.circle(0, 0, 95, 0xffffff).setStrokeStyle(6, save.gems >= item.cost ? 0x7ccf5e : 0xcccccc));
      card.add(sized(this, 0, 0, `deco-${item.id}`, 140));
      card.add(sized(this, -24, 125, 'gem', 40));
      card.add(text(this, 18, 125, String(item.cost), 44));
      card.setSize(200, 260).setInteractive({ useHandCursor: true }).on('pointerup', () => {
        if (save.gems < item.cost) { sfx.boop(this); wobble(this, card); say(this, 'shop_need'); return; }
        save.gems -= item.cost;
        const d = { id: item.id, x: Phaser.Math.Between(450, 1350), y: Phaser.Math.Between(620, 900) };
        save.decor.push(d); commit();
        this.gemText.setText(String(save.gems));
        layer.destroy();
        const img = this.placeDecor(d), sc = img.scale;
        img.setScale(0);
        this.tweens.add({ targets: img, scale: sc, duration: 500, ease: 'Back.out' });
        sfx.sparkle(this);
        say(this, 'shop_buy');
      });
      layer.add(card);
    });
    layer.add(roundButton(this, W - 170, 160, '✖️', () => layer.destroy(), 46));
    say(this, 'shop_hi');
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
      const x = 275 + (i % 8) * 150, y = 300 + Math.floor(i / 8) * 215, got = !!save.nodes[n.id];
      layer.add(this.add.circle(x, y, 62, got ? 0xfff0b3 : 0xeeeeee).setStrokeStyle(6, got ? 0xf2b705 : 0xcccccc));
      const img = this.add.image(x, y, `animal-${n.animal}`);
      img.setScale(100 / Math.max(img.width, img.height));
      if (!got) img.setTintFill(0xbdb5ad).setAlpha(0.6);
      layer.add(img);
      layer.add(this.add.text(x, y + 82, got ? (NAMES[n.animal] ?? n.animal) : '?', {
        fontFamily: FONT, fontSize: '26px', fontStyle: '600', color: INK }).setOrigin(0.5));
      layer.add(this.add.text(x - 50, y - 50, realmOf(n.id).icon, { fontSize: '26px' }).setOrigin(0.5));
    });
    const close = roundButton(this, W - 170, 130, '✖️', () => layer.destroy(), 46);
    layer.add(close);
    say(this, 'book_hi');
  }
}
