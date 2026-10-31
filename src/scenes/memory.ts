import Phaser from 'phaser';
import { answer, Fact, SKILLS } from '../engine';
import { RoundScene } from '../round';
import { FONT, INK, say, save, sfx, W } from '../ui';

const CW = 190, CH = 220;
type Card = Phaser.GameObjects.Container & { key: string; face: Phaser.GameObjects.Container; up: boolean; done: boolean };

/**
 * Memory Match: cards face down; find each sum ("6 + 7") and its answer ("13").
 * ponytail: turning cards over is partly luck, so a match is recorded as "helped" (counts as practice,
 * never promotes a fact) and misses aren't recorded at all. The other games drive the adaptivity.
 */
export class MemoryScene extends RoundScene {
  bg = 'bg-cabin';
  private open: Card[] = [];
  private misses = 0;
  constructor() { super('memory'); }

  count() { return this.node.parts ? 3 : 4; }
  ask() { /* one board per round, see begin() */ }

  begin() {
    this.open = []; this.misses = 0;
    this.layer = this.add.container(0, 0);
    // distinct facts, topped up from the skill if the engine picked repeats
    const seen = new Set<string>(), facts: Fact[] = [];
    for (const f of [...this.queue, ...Phaser.Utils.Array.Shuffle([...SKILLS[this.cfg.skill].facts])]) {
      if (facts.length < this.count() && !seen.has(String(f))) { seen.add(String(f)); facts.push(f); }
    }
    this.queue = [];
    const cards = Phaser.Utils.Array.Shuffle(facts.flatMap(([t, a]) => [
      { key: `${t}:${a}`, label: `${a} + ${t - a}` }, { key: `${t}:${a}`, label: String(t) }]));
    const cols = cards.length / 2;
    cards.forEach((c, i) => this.card(c.key, c.label,
      W / 2 + ((i % cols) - (cols - 1) / 2) * (CW + 30), 330 + Math.floor(i / cols) * (CH + 40), i));
    say(this, 'mm_intro');
  }

  private card(key: string, label: string, x: number, y: number, i: number) {
    const c = this.add.container(x, y) as Card;
    c.add(this.add.rectangle(4, 8, CW, CH, 0x000000, 0.15));
    const back = this.add.graphics();
    back.fillStyle(0xff8fb1).fillRoundedRect(-CW / 2, -CH / 2, CW, CH, 24).lineStyle(8, 0xffffff).strokeRoundedRect(-CW / 2, -CH / 2, CW, CH, 24);
    back.fillStyle(0xffffff, 0.5).fillCircle(0, 0, 40);
    const face = this.add.container(0, 0);
    const fg = this.add.graphics();
    fg.fillStyle(0xffffff).fillRoundedRect(-CW / 2, -CH / 2, CW, CH, 24).lineStyle(8, 0x8fd3ff).strokeRoundedRect(-CW / 2, -CH / 2, CW, CH, 24);
    face.add([fg, this.add.text(0, 0, label, { fontFamily: FONT, fontSize: label.length > 3 ? '54px' : '92px', fontStyle: '600', color: INK }).setOrigin(0.5)]);
    face.setVisible(false);
    c.add([back, face]);
    Object.assign(c, { key, face, up: false, done: false });
    c.setSize(CW, CH).setInteractive({ useHandCursor: true }).on('pointerup', () => this.flip(c));
    c.setScale(0);
    this.tweens.add({ targets: c, scale: 1, delay: i * 60, duration: 300, ease: 'Back.out' });
    this.layer.add(c);
  }

  private turn(c: Card, up: boolean, onDone?: () => void) {
    c.up = up;
    this.tweens.add({ targets: c, scaleX: 0, duration: 120, onComplete: () => {
      c.face.setVisible(up);
      this.tweens.add({ targets: c, scaleX: 1, duration: 120, onComplete: onDone });
    } });
  }

  private flip(c: Card) {
    if (c.up || c.done || this.open.length >= 2) return;
    sfx.tap(this);
    this.open.push(c);
    this.turn(c, true, () => {
      if (this.open.length < 2) return;
      const [p, q] = this.open;
      if (p.key === q.key) {
        p.done = q.done = true;
        this.open = [];
        const [t, a] = p.key.split(':').map(Number);
        answer(save, t, a, true, 0, true);
        [p, q].forEach(x => { this.tweens.add({ targets: x, y: x.y - 20, duration: 200, yoyo: true }); x.setAlpha(0.85); });
        this.right(`bond_${t}_${a}`);
        return;
      }
      this.misses++;
      if (this.misses === 1) say(this, 'mm_nope');
      this.time.delayedCall(900, () => {
        [p, q].forEach(x => this.turn(x, false));
        this.open = [];
        // every 6 misses the pet lets her peek at the whole board
        if (this.misses % 6 === 0) this.peek();
      });
    });
  }

  private peek() {
    const hidden = this.layer.list.filter(o => !(o as Card).done && !(o as Card).up) as Card[];
    hidden.forEach(c => this.turn(c, true));
    this.pet.hop();
    this.time.delayedCall(1600, () => hidden.forEach(c => this.turn(c, false)));
  }

  // matched pairs advance via right() -> next(); the round ends once the board is clear
  next() {
    if (this.layer?.list.every(o => (o as Card).done)) this.finish();
  }
}
