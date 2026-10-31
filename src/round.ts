import Phaser from 'phaser';
import { answer, choices, Fact, pick, SKILLS, stars } from './engine';
import type { MapNode, Part } from './world';
import { realmOf } from './world';
import {
  burst, commit, confetti, cover, ensureVoice, fadeTo, H, homeButton, numberCard, Pet, randomLine, replayButton,
  save, say, sfx, W, wobble,
} from './ui';

export type RoundData = { node: MapNode; part?: number; wrong?: number };
const BOSS_QUESTIONS = 3, QUESTIONS = 6;

/**
 * Shared shell for every mini-game: background, buttons, pet, progress dots, question queue from the
 * engine, the answer-card hint ladder, and the end of round (incl. chaining boss parts).
 */
export abstract class RoundScene extends Phaser.Scene {
  node!: MapNode;
  cfg!: Part;
  round!: RoundData;
  pet!: Pet;
  queue: Fact[] = [];
  wrongTotal = 0;
  layer!: Phaser.GameObjects.Container;
  private dots: Phaser.GameObjects.Arc[] = [];
  private done = 0;
  private startedAt = 0;
  private cloud?: Phaser.GameObjects.Container;

  abstract bg: string;
  abstract ask(f: Fact): void;
  /** How many facts the round needs from the engine. */
  count(): number { return this.node.parts ? BOSS_QUESTIONS : QUESTIONS; }
  /** How many progress dots (questions to answer). */
  goal(): number { return this.count(); }
  /** Called once after setup; most games just start asking. */
  begin() { this.next(); }

  create(d: RoundData) {
    this.round = d;
    this.node = d.node;
    this.cfg = d.node.parts ? d.node.parts[d.part ?? 0] : d.node;
    this.wrongTotal = d.wrong ?? 0;
    this.done = 0;
    this.startedAt = Date.now();
    this.cameras.main.fadeIn(400, 255, 250, 240);
    cover(this, this.bg);
    homeButton(this);
    replayButton(this);
    this.pet = new Pet(this, 170, H - 30, 230);
    this.pet.img.setDepth(30);
    this.queue = pick(save, SKILLS[this.cfg.skill], this.count());
    const n = this.goal();
    this.dots = [...Array(n)].map((_, i) =>
      this.add.circle(W / 2 + (i - (n - 1) / 2) * 50, 60, 16, 0xffffff, 0.8).setStrokeStyle(4, 0x7ccf5e).setDepth(40));
    if (this.node.parts) this.storm();
    const go = () => this.begin();
    if (this.node.parts && !d.part) say(this, 'boss_intro').then(go); else go();
  }

  next() {
    this.layer?.destroy();
    this.layer = this.add.container(0, 0);
    const f = this.queue.shift();
    if (!f) return this.finish();
    this.ask(f);
  }

  /** Mark one question done: progress dot, storm cloud shrinks. */
  tick() {
    this.dots[this.done++]?.setFillStyle(0xffd34d, 1);
    if (this.cloud) {
      const parts = this.node.parts!.length, p = ((this.round.part ?? 0) * BOSS_QUESTIONS + this.done) / (parts * BOSS_QUESTIONS);
      this.tweens.add({ targets: this.cloud, scale: 1 - p * 0.75, alpha: 1 - p * 0.6, duration: 600, ease: 'Back.out' });
    }
  }

  /** Boss stops: a grumpy storm cloud that shrinks with every right answer across all parts. */
  private storm() {
    const c = this.cloud = this.add.container(330, 210).setDepth(35); // top-left is clear in every game
    const g = this.add.graphics();
    g.fillStyle(0x7d849c);
    [[-90, 10, 60], [-30, -25, 75], [50, -15, 70], [105, 15, 50], [0, 25, 70]].forEach(([x, y, r]) => g.fillCircle(x, y, r));
    g.fillStyle(0x2f3342).fillCircle(-25, 5, 8).fillCircle(25, 5, 8);
    g.lineStyle(5, 0x2f3342).beginPath().arc(0, 45, 18, Math.PI * 1.15, Math.PI * 1.85).strokePath();
    c.add(g);
    const parts = this.node.parts!.length, p = ((this.round.part ?? 0) * BOSS_QUESTIONS) / (parts * BOSS_QUESTIONS);
    c.setScale(1 - p * 0.75).setAlpha(1 - p * 0.6);
    this.tweens.add({ targets: c, x: c.x + 40, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  /**
   * Show answer cards (or custom option objects) and run the hint ladder:
   * right first time -> fact promoted; 1st miss -> hint(); 2nd miss -> demo(), then the right one pulses.
   */
  options(o: {
    fact: Fact; answer: number; max: number; prompt?: string | string[]; rightLine: string; y?: number; count?: number;
    hintLine?: string; hint?: () => void; demo?: () => Promise<void>; onRight?: () => void;
    make?: (n: number, i: number, x: number, onTap: (c: Phaser.GameObjects.Container) => void) => Phaser.GameObjects.Container;
    also?: number[]; gap?: number;
  }) {
    const [t, a] = o.fact, t0 = Date.now();
    const opts = choices(o.answer, o.max, o.count ?? 3, Math.random, o.also);
    let wrong = 0;
    void ensureVoice(this, o.rightLine);
    const make = o.make ?? ((n, i, x, onTap) => numberCard(this, x, o.y ?? 800, n, i, onTap));
    const value = new Map<Phaser.GameObjects.Container, number>();
    const cards = opts.map((n, i) => {
      const c = make(n, i, W / 2 + (i - (opts.length - 1) / 2) * (o.gap ?? 200), card => {
        if (!cards.includes(card)) return;
        if (n === o.answer) {
          cards.forEach(x => x.disableInteractive());
          if (wrong === 0) answer(save, t, a, true, Date.now() - t0);
          this.tweens.killTweensOf(card);
          this.tweens.add({ targets: card, scale: 1.25, y: card.y - 30, duration: 250, ease: 'Back.out' });
          burst(this, card.x, card.y);
          o.onRight?.();
          return this.right(o.rightLine);
        }
        wrong++; this.wrongTotal++;
        if (wrong === 1) answer(save, t, a, false, Date.now() - t0);
        sfx.boop(this); this.pet.tilt(); wobble(this, card);
        this.tweens.add({ targets: card, alpha: 0.25, scale: 0.85, duration: 300 });
        card.disableInteractive();
        cards.splice(cards.indexOf(card), 1);
        if (wrong === 1) { say(this, o.hintLine ?? randomLine('oops', 3)); o.hint?.(); }
        else {
          const pulse = () => { const r = cards.find(c => value.get(c) === o.answer); if (r) this.tweens.add({ targets: r, scale: 1.15, duration: 400, yoyo: true, repeat: -1 }); };
          if (o.demo) { this.input.enabled = false; o.demo().then(() => { this.input.enabled = true; pulse(); }); } else pulse();
        }
      });
      value.set(c, n);
      return c;
    });
    cards.forEach((c, i) => { const s = c.scale; c.setScale(0); this.tweens.add({ targets: c, scale: s, delay: 150 + i * 80, duration: 300, ease: 'Back.out' }); });
    this.layer.add(cards);
    if (o.prompt) say(this, ...([] as string[]).concat(o.prompt));
    return cards;
  }

  /** Right answer: fanfare, pet hop, progress, say the fact, then the next question. */
  right(line: string) {
    sfx.ding(this);
    this.pet.hop(2);
    this.tick();
    this.input.enabled = false;
    say(this, line, ...(Math.random() < 0.35 ? [randomLine('praise', 5)] : [])).then(() => {
      this.input.enabled = true;
      commit();
      this.next();
    });
  }

  /** Pet counts things out loud ("one, two, three"), calling step(i) in time with each number. */
  async countAloud(n: number, step: (i: number) => void) {
    await say(this, 'watch_me');
    for (let i = 0; i < n; i++) { step(i); sfx.drop(this); await say(this, `num_${i + 1}`); }
  }

  finish() {
    save.playMs += Date.now() - this.startedAt;
    const parts = this.node.parts, part = this.round.part ?? 0;
    if (parts && part + 1 < parts.length) {
      commit();
      this.input.enabled = false;
      sfx.sparkle(this);
      say(this, 'boss_next').then(() =>
        fadeTo(this, parts[part + 1].game, { node: this.node, part: part + 1, wrong: this.wrongTotal }));
      return;
    }
    const s = stars(this.wrongTotal), id = this.node.id;
    const newly = !save.nodes[id];
    save.nodes[id] = Math.max(save.nodes[id] ?? 0, s);
    commit();
    finishRound(this, s, () => fadeTo(this, 'map', { realm: realmOf(id).id, justDone: id, newly }));
  }
}

/** End-of-round celebration: stars drop in one by one, confetti, voice. */
export function finishRound(scene: Phaser.Scene, s: number, then: () => void) {
  scene.input.enabled = false;
  scene.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.55).setDepth(70);
  for (let i = 0; i < 3; i++) {
    const st = scene.add.image(W / 2 + (i - 1) * 190, H / 2 - 40, 'bigstar').setDepth(71).setScale(0);
    if (i >= s) st.setTint(0xbbbbbb);
    scene.tweens.add({ targets: st, scale: 1.3, angle: 360, delay: 300 + i * 350, duration: 500, ease: 'Back.out', onStart: () => { if (i < s) sfx.ding(scene); } });
  }
  confetti(scene);
  scene.time.delayedCall(1400, () => { sfx.fanfare(scene); say(scene, 'round_done').then(() => scene.time.delayedCall(400, then)); });
}
