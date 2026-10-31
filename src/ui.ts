import Phaser from 'phaser';
import { load, persist, Save } from './engine';

export const W = 1600, H = 1000;
export const FONT = 'Fredoka, sans-serif';
export const INK = '#5b3a29';
export const save: Save = load();
export const commit = () => persist(save);
/** When this play session began (reset on the title screen), for the grown-ups' time limit. */
export const session = { start: Date.now() };

export const PETS = ['fox', 'bunny', 'puppy'] as const;

// ---------- layout ----------
/** Image of `key` scaled so its width is `px`. */
export const sized = (scene: Phaser.Scene, x: number, y: number, key: string, px: number) => {
  const img = scene.add.image(x, y, key);
  return img.setScale(px / img.width);
};

export function cover(scene: Phaser.Scene, key: string) {
  const img = scene.add.image(W / 2, H / 2, key);
  return img.setScale(Math.max(W / img.width, H / img.height));
}

export function text(scene: Phaser.Scene, x: number, y: number, s: string, size = 64, color = INK) {
  return scene.add.text(x, y, s, {
    fontFamily: FONT, fontSize: `${size}px`, fontStyle: '600', color,
    stroke: '#ffffff', strokeThickness: Math.round(size / 6), align: 'center',
    resolution: Math.min(2, window.devicePixelRatio || 1),
  }).setOrigin(0.5);
}

export function fadeTo(scene: Phaser.Scene, key: string, data?: object) {
  scene.input.enabled = false;
  scene.cameras.main.fadeOut(350, 255, 250, 240);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
}

// ---------- voice: queued clips, a new say() cuts off the old one ----------
let voiceToken = 0;
let current: Phaser.Sound.BaseSound | null = null;
let lastSaid: string[] = [];

/** Voice clips load on first use (500+ of them, too many to preload). */
export function ensureVoice(scene: Phaser.Scene, k: string): Promise<void> {
  const key = 'v_' + k;
  if (scene.cache.audio.exists(key)) return Promise.resolve();
  return new Promise(res => {
    scene.load.audio(key, `assets/voice/${k}.mp3`);
    scene.load.once(`filecomplete-audio-${key}`, () => res());
    scene.load.once('loaderror', () => res()); // ponytail: a missing clip is skipped, not fatal
    scene.load.start();
  });
}

export function say(scene: Phaser.Scene, ...keys: string[]): Promise<void> {
  const my = ++voiceToken;
  current?.stop();
  lastSaid = keys;
  return keys.reduce<Promise<void>>((p, k) => p.then(() => ensureVoice(scene, k)).then(() => new Promise<void>(done => {
    if (my !== voiceToken || !scene.cache.audio.exists('v_' + k)) return done();
    const snd = scene.sound.add('v_' + k);
    current = snd;
    let finished = false;
    const end = () => { if (finished) return; finished = true; snd.destroy(); done(); };
    snd.once('complete', end);
    snd.once('stop', end);
    snd.play();
  })), Promise.resolve()).then(() => { if (my === voiceToken) current = null; });
}
export const sayAgain = (scene: Phaser.Scene) => say(scene, ...lastSaid);
export const speaking = () => current !== null;
export const randomLine = (prefix: string, n: number) => `${prefix}_${1 + Math.floor(Math.random() * n)}`;

// ---------- synth sound effects (no files) ----------
function ctx(scene: Phaser.Scene): AudioContext | null {
  return (scene.sound as Phaser.Sound.WebAudioSoundManager).context ?? null;
}
function tone(scene: Phaser.Scene, freq: number, at: number, dur: number, type: OscillatorType = 'sine', vol = 0.18, slideTo?: number) {
  const c = ctx(scene); if (!c) return;
  const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
}
export const sfx = {
  pop: (s: Phaser.Scene) => { tone(s, 500, 0, 0.12, 'sine', 0.25, 1400); tone(s, 1800, 0.03, 0.06, 'triangle', 0.08); },
  drop: (s: Phaser.Scene) => tone(s, 700, 0, 0.1, 'triangle', 0.15, 350),
  tap: (s: Phaser.Scene) => tone(s, 900, 0, 0.06, 'triangle', 0.12),
  ding: (s: Phaser.Scene) => [784, 988, 1175].forEach((f, i) => tone(s, f, i * 0.08, 0.35, 'sine', 0.16)),
  boop: (s: Phaser.Scene) => tone(s, 260, 0, 0.25, 'sine', 0.18, 180),
  sparkle: (s: Phaser.Scene) => [1047, 1319, 1568, 2093, 1568, 2093].forEach((f, i) => tone(s, f, i * 0.07, 0.3, 'triangle', 0.09)),
  fanfare: (s: Phaser.Scene) => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(s, f, i * 0.12, i === 5 ? 0.8 : 0.22, 'triangle', 0.14)),
};

// ---------- generated textures ----------
export function makeTextures(scene: Phaser.Scene) {
  const g = scene.make.graphics({}, false);
  g.fillStyle(0xffffff).fillCircle(16, 16, 16).generateTexture('dot', 32, 32).clear();
  const star = (cx: number, cy: number, r: number) => {
    const pts: Phaser.Types.Math.Vector2Like[] = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr });
    }
    return pts;
  };
  g.fillStyle(0xffffff).fillPoints(star(24, 24, 24), true).generateTexture('star', 48, 48).clear();
  g.fillStyle(0xffd34d).fillPoints(star(60, 60, 58), true).lineStyle(6, 0xe0a100).strokePoints(star(60, 60, 58), true)
    .generateTexture('bigstar', 120, 120).clear();
  g.fillStyle(0xffffff).fillRoundedRect(0, 0, 14, 22, 3).generateTexture('confetti', 14, 22).destroy();

  // soap bubble: transparent middle, rainbow rim, white highlight
  const size = 220, tex = scene.textures.createCanvas('bubble', size, size)!, c = tex.getContext(), r = size / 2;
  const body = c.createRadialGradient(r, r, r * 0.55, r, r, r);
  body.addColorStop(0, 'rgba(255,255,255,0.10)');
  body.addColorStop(0.75, 'rgba(150,200,255,0.4)');
  body.addColorStop(0.9, 'rgba(240,150,220,0.7)');
  body.addColorStop(1, 'rgba(255,255,255,1)');
  c.fillStyle = body; c.beginPath(); c.arc(r, r, r - 2, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.85)';
  c.beginPath(); c.ellipse(r * 0.62, r * 0.55, r * 0.2, r * 0.11, -0.7, 0, Math.PI * 2); c.fill();
  tex.refresh();
}

export function burst(scene: Phaser.Scene, x: number, y: number, count = 24, tints = [0xffd34d, 0xff8fb1, 0x8fd3ff, 0xb3f28f, 0xffffff]) {
  const p = scene.add.particles(x, y, 'star', {
    speed: { min: 200, max: 560 }, angle: { min: 0, max: 360 }, scale: { start: 0.9, end: 0 },
    lifespan: 900, gravityY: 500, rotate: { min: 0, max: 360 }, tint: tints, emitting: false,
  }).setDepth(50);
  p.explode(count);
  scene.time.delayedCall(1200, () => p.destroy());
}

export function confetti(scene: Phaser.Scene) {
  const p = scene.add.particles(0, -30, 'confetti', {
    x: { min: 0, max: W }, speedY: { min: 250, max: 500 }, speedX: { min: -80, max: 80 },
    rotate: { start: 0, end: 720 }, lifespan: 3500, quantity: 3, frequency: 30,
    tint: [0xff6b9a, 0xffd34d, 0x6bc5ff, 0x8be36b, 0xc78bff],
  }).setDepth(60);
  scene.time.delayedCall(1800, () => p.stop());
  scene.time.delayedCall(5500, () => p.destroy());
}

// ---------- pet companion ----------
export class Pet {
  img: Phaser.GameObjects.Image;
  private idle: Phaser.Tweens.Tween;
  constructor(public scene: Phaser.Scene, x: number, y: number, height: number, key = `pet-${save.pet ?? 'fox'}`) {
    // origin at the feet so squash/stretch keeps them planted
    this.img = scene.add.image(x, y, key).setOrigin(0.5, 1);
    this.img.setScale(height / this.img.height);
    const s = this.img.scale;
    this.idle = scene.tweens.add({ targets: this.img, scaleY: s * 1.03, scaleX: s * 0.985, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }
  hop(times = 1) {
    this.scene.tweens.add({ targets: this.img, y: this.img.y - 70, duration: 220, yoyo: true, repeat: times - 1, ease: 'Quad.out' });
  }
  tilt() {
    this.scene.tweens.add({ targets: this.img, angle: { from: -8, to: 8 }, duration: 160, yoyo: true, repeat: 2, onComplete: () => this.img.setAngle(0) });
  }
  moveTo(x: number, y: number, onDone?: () => void) {
    const hops = Math.max(1, Math.round(Phaser.Math.Distance.Between(this.img.x, this.img.y, x, y) / 120));
    this.img.setFlipX(x < this.img.x);
    this.scene.tweens.add({ targets: this.img, x, duration: hops * 260, ease: 'Linear' });
    this.scene.tweens.add({ targets: this.img, y, duration: hops * 260, ease: 'Linear', onComplete: () => onDone?.() });
    this.scene.tweens.add({ targets: this.img, scaleY: this.img.scaleY * 0.92, duration: 130, yoyo: true, repeat: hops * 2 - 1 });
  }
  destroy() { this.idle.stop(); this.img.destroy(); }
}

// ---------- controls ----------
export function pressable(obj: Phaser.GameObjects.GameObject & { scale: number }, scene: Phaser.Scene, onTap: () => void) {
  const base = obj.scale;
  (obj as unknown as Phaser.GameObjects.Image).setInteractive({ useHandCursor: true })
    .on('pointerdown', () => scene.tweens.add({ targets: obj, scale: base * 0.9, duration: 80 }))
    .on('pointerout', () => scene.tweens.add({ targets: obj, scale: base, duration: 80 }))
    .on('pointerup', () => { scene.tweens.add({ targets: obj, scale: base, duration: 120, ease: 'Back.out' }); onTap(); });
  return obj;
}

export function roundButton(scene: Phaser.Scene, x: number, y: number, label: string, onTap: () => void, r = 56) {
  const c = scene.add.container(x, y).setDepth(40);
  c.add(scene.add.circle(0, 4, r, 0x000000, 0.15));
  c.add(scene.add.circle(0, 0, r, 0xffffff).setStrokeStyle(6, 0xf2c14e));
  c.add(scene.add.text(0, 2, label, { fontSize: `${r}px`, fontFamily: FONT }).setOrigin(0.5));
  c.setSize(r * 2, r * 2);
  pressable(c, scene, () => { sfx.tap(scene); onTap(); });
  return c;
}

export function homeButton(scene: Phaser.Scene) {
  return roundButton(scene, 80, 80, '🏠', () => fadeTo(scene, 'map'));
}
export function replayButton(scene: Phaser.Scene) {
  return roundButton(scene, W - 80, 80, '🔊', () => sayAgain(scene));
}

const CARD_COLOURS = [0xff8fb1, 0x8fd3ff, 0xb3e88f, 0xffc56b, 0xc9a7ff];
export function numberCard(scene: Phaser.Scene, x: number, y: number, n: number, i: number, onTap: (card: Phaser.GameObjects.Container) => void) {
  const c = scene.add.container(x, y);
  const w = 150, h = 170;
  c.add(scene.add.rectangle(0, 8, w, h, 0x000000, 0.15).setOrigin(0.5));
  const face = scene.add.graphics();
  face.fillStyle(0xffffff).fillRoundedRect(-w / 2, -h / 2, w, h, 28);
  face.lineStyle(8, CARD_COLOURS[i % CARD_COLOURS.length]).strokeRoundedRect(-w / 2, -h / 2, w, h, 28);
  c.add(face);
  c.add(text(scene, 0, 0, String(n), 104));
  c.setSize(w, h);
  pressable(c, scene, () => onTap(c));
  return c;
}

export function wobble(scene: Phaser.Scene, obj: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject) {
  const x = obj.x;
  scene.tweens.add({ targets: obj, x: x + 18, duration: 60, yoyo: true, repeat: 3, onComplete: () => { obj.x = x; } });
}
