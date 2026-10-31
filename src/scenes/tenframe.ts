import Phaser from 'phaser';
import { answer, choices, pick, SKILLS, stage, stars } from '../engine';
import type { MapNode } from './map';
import {
  burst, commit, confetti, cover, fadeTo, H, homeButton, numberCard, Pet, randomLine, replayButton,
  save, say, sfx, text, W, wobble,
} from '../ui';

const QUESTIONS = 6;
const CELL = 128, GAP = 14;

/**
 * Ten-frame (or five-frame) bonds. Stage per fact (from the engine):
 *  0 concrete  - drag ladybirds to fill the frame, then "how many did you add?"
 *  1 pictorial - frame shown, pick the missing number
 *  2 abstract  - "a + ? = total", frame only appears as a hint after a mistake
 */
export class TenFrameScene extends Phaser.Scene {
  private node!: MapNode;
  private pet!: Pet;
  private queue: number[] = [];
  private wrongTotal = 0;
  private layer!: Phaser.GameObjects.Container;
  private shownFillHelp = false;

  constructor() { super('tenframe'); }

  create(data: { node: MapNode }) {
    this.node = data.node;
    this.cameras.main.fadeIn(400, 255, 250, 240);
    cover(this, 'bg-garden');
    homeButton(this);
    replayButton(this);
    this.pet = new Pet(this, 170, H - 30, 230);
    this.queue = pick(save, SKILLS[this.node.total === 5 ? 'bonds5' : 'bonds10'], QUESTIONS);
    this.wrongTotal = 0;
    this.shownFillHelp = false;
    this.progressDots();
    this.next();
  }

  private dots: Phaser.GameObjects.Arc[] = [];
  private progressDots() {
    this.dots = [...Array(QUESTIONS)].map((_, i) =>
      this.add.circle(W / 2 + (i - (QUESTIONS - 1) / 2) * 50, 60, 16, 0xffffff, 0.8).setStrokeStyle(4, 0x7ccf5e).setDepth(40));
  }

  private next() {
    this.layer?.destroy();
    const a = this.queue.shift();
    if (a === undefined) return this.finish();
    this.ask(a);
  }

  private ask(a: number) {
    const total = this.node.total, b = total - a, st = stage(save, total, a);
    const L = this.layer = this.add.container(0, 0);
    const cols = 5, rows = total / 5;
    const fw = cols * CELL + (cols - 1) * GAP, fh = rows * CELL + (rows - 1) * GAP;
    const fx = W / 2 - fw / 2, fy = (st === 0 ? 330 : 360) - fh / 2;

    // frame board
    const board = this.add.graphics();
    board.fillStyle(0x000000, 0.12).fillRoundedRect(fx - 26, fy - 18, fw + 52, fh + 52, 30);
    board.fillStyle(0xfff6e0).fillRoundedRect(fx - 26, fy - 26, fw + 52, fh + 52, 30);
    board.lineStyle(8, 0xc98a4b).strokeRoundedRect(fx - 26, fy - 26, fw + 52, fh + 52, 30);
    const frame = this.add.container(0, 0, [board]);
    L.add(frame);
    const cells = [...Array(total)].map((_, i) => {
      const x = fx + (i % cols) * (CELL + GAP) + CELL / 2, y = fy + Math.floor(i / cols) * (CELL + GAP) + CELL / 2;
      const r = this.add.rectangle(x, y, CELL, CELL, 0xffffff).setStrokeStyle(5, 0xe2b98a);
      frame.add(r);
      return { x, y, r, filled: i < a };
    });
    const bug = (x: number, y: number) => { const s = this.add.image(x, y, 'ladybird'); return s.setScale((CELL * 0.78) / s.width); };
    cells.slice(0, a).forEach((c, i) => {
      const s = bug(c.x, c.y - 300).setAlpha(0);
      frame.add(s);
      this.tweens.add({ targets: s, y: c.y, alpha: 1, duration: 350, delay: i * 90, ease: 'Bounce.out', onStart: () => sfx.drop(this) });
    });

    if (st === 2) {
      frame.setAlpha(0);
      L.add(text(this, W / 2, 380, `${a} + ? = ${total}`, 150));
    }

    const t0 = Date.now();
    let wrong = 0;
    const empty = () => cells.filter(c => !c.filled);
    const hintCells = () => empty().forEach(c => this.tweens.add({ targets: c.r, fillColor: { from: 0xffffff, to: 0xfff0a0 }, duration: 300, yoyo: true, repeat: 3 }));

    const showCards = (correct: number, prompt: string) => {
      const opts = choices(correct, total, st === 2 ? 4 : 3);
      const cards = opts.map((n, i) => numberCard(this, W / 2 + (i - (opts.length - 1) / 2) * 200, 800, n, i, card => {
        if (!cards.includes(card)) return;
        if (n === correct) {
          cards.forEach(c => c.disableInteractive());
          if (wrong === 0) answer(save, total, a, true, Date.now() - t0);
          return this.right(a, card, () => {
            // show the full bond: ghost ladybirds fill the gaps
            if (st > 0) { frame.setAlpha(1); empty().forEach((c, i) => { const s = bug(c.x, c.y).setAlpha(0); frame.add(s); this.tweens.add({ targets: s, alpha: 0.85, delay: i * 70, duration: 200 }); }); }
          });
        }
        wrong++; this.wrongTotal++;
        if (wrong === 1) answer(save, total, a, false, Date.now() - t0);
        sfx.boop(this); this.pet.tilt(); wobble(this, card);
        this.tweens.add({ targets: card, alpha: 0.25, scale: 0.85, duration: 300 });
        card.disableInteractive();
        cards.splice(cards.indexOf(card), 1);
        if (frame.alpha < 1) this.tweens.add({ targets: frame, alpha: 1, duration: 400 });
        if (wrong === 1) { say(this, 'tf_hint'); hintCells(); }
        else this.demo(empty(), bug, frame, () => cards.find(c => value.get(c) === correct));
      }));
      const value = new Map(cards.map((c, i) => [c, opts[i]]));
      cards.forEach((c, i) => { c.setScale(0); this.tweens.add({ targets: c, scale: 1, delay: 150 + i * 80, duration: 300, ease: 'Back.out' }); });
      L.add(cards);
      say(this, prompt);
    };

    if (st > 0) {
      this.time.delayedCall(a * 90 + 300, () => showCards(b, `more_${total}_${a}`));
      return;
    }

    // concrete: drag ladybirds from the leaf pile into the empty cells
    const pile = this.add.ellipse(W - 330, 560, 420, 260, 0x8fd16a).setStrokeStyle(8, 0x5ea644);
    L.add(pile);
    const lines = [`more_${total}_${a}`];
    if (!this.shownFillHelp) { lines.push('tf_fill'); this.shownFillHelp = true; }
    this.time.delayedCall(a * 90 + 300, () => say(this, ...lines));
    if (b === 0) { this.time.delayedCall(a * 90 + 900, () => showCards(0, 'tf_added')); return; }
    for (let i = 0; i < total; i++) {
      // loose grid on the leaf so the bugs don't pile on top of each other
      const hx = W - 330 + ((i % 5) - 2) * 72 + Phaser.Math.Between(-10, 10);
      const hy = 560 + (Math.floor(i / 5) - (total / 5 - 1) / 2) * 95 + Phaser.Math.Between(-15, 15);
      const s = bug(hx, hy).setScale((CELL * 0.7) / this.textures.getFrame('ladybird').width).setAngle(Phaser.Math.Between(-30, 30));
      s.setInteractive({ draggable: true, useHandCursor: true });
      L.add(s);
      s.on('dragstart', () => { L.bringToTop(s); s.setScale(s.scale * 1.15); sfx.tap(this); });
      s.on('drag', (_: unknown, x: number, y: number) => s.setPosition(x, y));
      s.on('dragend', () => {
        s.setScale((CELL * 0.7) / this.textures.getFrame('ladybird').width);
        const target = empty().map(c => ({ c, d: Phaser.Math.Distance.Between(c.x, c.y, s.x, s.y) })).sort((p, q) => p.d - q.d)[0];
        if (target && target.d < CELL) {
          target.c.filled = true;
          target.c.r.setFillStyle(0xd6f5c0); // her added ones stay visibly different, so she can count them
          s.disableInteractive();
          this.tweens.add({ targets: s, x: target.c.x, y: target.c.y, angle: 0, scale: (CELL * 0.78) / this.textures.getFrame('ladybird').width, duration: 150 });
          sfx.drop(this);
          if (empty().length === 0) { sfx.ding(this); this.time.delayedCall(500, () => showCards(b, 'tf_added')); this.disableBugs(L); }
        } else {
          this.tweens.add({ targets: s, x: hx, y: hy, duration: 250, ease: 'Quad.out' });
        }
      });
    }
  }

  private disableBugs(L: Phaser.GameObjects.Container) {
    L.list.forEach(o => { if ((o as Phaser.GameObjects.Image).input?.draggable) (o as Phaser.GameObjects.Image).disableInteractive(); });
  }

  /** Second mistake: the pet counts the empty spaces, filling each one, then the right card glows. */
  private demo(empty: { x: number; y: number }[], bug: (x: number, y: number) => Phaser.GameObjects.Image, frame: Phaser.GameObjects.Container, findCard: () => Phaser.GameObjects.Container | undefined) {
    this.input.enabled = false;
    say(this, 'watch_me', ...empty.map((_, i) => `num_${i + 1}`)).then(() => {
      this.input.enabled = true;
      const card = findCard();
      if (card) this.tweens.add({ targets: card, scale: 1.15, duration: 400, yoyo: true, repeat: -1 });
    });
    // roughly sync each ladybird with its number word
    empty.forEach((c, i) => this.time.delayedCall(1500 + i * 750, () => {
      const s = bug(c.x, c.y).setAlpha(0.8); frame.add(s); sfx.drop(this);
      this.tweens.add({ targets: s, scale: { from: 0, to: s.scale }, duration: 200, ease: 'Back.out' });
    }));
  }

  private right(a: number, card: Phaser.GameObjects.Container, reveal: () => void) {
    sfx.ding(this);
    this.tweens.killTweensOf(card);
    this.tweens.add({ targets: card, scale: 1.25, y: card.y - 30, duration: 250, ease: 'Back.out' });
    burst(this, card.x, card.y);
    this.pet.hop(2);
    reveal();
    const i = QUESTIONS - this.queue.length - 1;
    this.dots[i]?.setFillStyle(0xffd34d, 1);
    this.input.enabled = false;
    say(this, `bond_${this.node.total}_${a}`, ...(Math.random() < 0.4 ? [randomLine('praise', 5)] : [])).then(() => {
      this.input.enabled = true;
      commit();
      this.next();
    });
  }

  private finish() {
    const s = stars(this.wrongTotal), id = this.node.id;
    const newly = !save.nodes[id];
    save.nodes[id] = Math.max(save.nodes[id] ?? 0, s);
    commit();
    finishRound(this, s, () => fadeTo(this, 'map', { justDone: id, newly }));
  }
}

/** Shared end-of-round celebration: stars drop in one by one, confetti, voice. */
export function finishRound(scene: Phaser.Scene, s: number, then: () => void) {
  scene.input.enabled = false;
  scene.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.55).setDepth(70);
  for (let i = 0; i < 3; i++) {
    const st = scene.add.image(W / 2 + (i - 1) * 190, H / 2 - 40, 'bigstar').setDepth(71).setScale(0);
    if (i >= s) st.setTint(0xbbbbbb);
    scene.tweens.add({ targets: st, scale: 1.3, angle: 360, delay: 300 + i * 350, duration: 500, ease: 'Back.out', onStart: () => i < s && sfx.ding(scene) });
  }
  confetti(scene);
  scene.time.delayedCall(1400, () => { sfx.fanfare(scene); say(scene, 'round_done').then(() => scene.time.delayedCall(400, then)); });
}
