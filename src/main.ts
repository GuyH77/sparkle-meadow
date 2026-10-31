import Phaser from 'phaser';
import '@fontsource/fredoka/600.css';
import lines from './lines.json';
import { cover, FONT, H, makeTextures, PETS, Pet, pressable, save, session, sfx, text, W } from './ui';
import { ALL_NODES } from './world';
import { AdoptScene } from './scenes/adopt';
import { MapScene } from './scenes/map';
import { TenFrameScene } from './scenes/tenframe';
import { BubblesScene } from './scenes/bubbles';
import { FeedScene } from './scenes/feed';
import { CherryScene } from './scenes/cherry';
import { HopScene } from './scenes/hop';
import { SanctuaryScene } from './scenes/sanctuary';
import { GrownupsScene } from './scenes/grownups';
import { BeadsScene } from './scenes/beads';
import { MirrorScene } from './scenes/mirror';
import { MemoryScene } from './scenes/memory';

const BACKGROUNDS = ['map', 'forest', 'rivermap', 'mountain', 'garden', 'pond', 'barn', 'orchard', 'river', 'clearing', 'sanctuary', 'alpine', 'cabin'];
const DECOR = ['flowerbed', 'tree', 'pond', 'bench', 'birdhouse', 'haybale', 'fountain', 'sunflowers', 'mushroomhouse', 'windmill'];
// question-specific clips ("bond_10_3") load on first use; the rest are preloaded
const CORE_LINES = Object.keys(lines).filter(k => !/_\d+_\d+$/.test(k));

class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  preload() {
    const bar = this.add.rectangle(W / 2 - 300, H / 2, 0, 30, 0x8fcf7a).setOrigin(0, 0.5);
    this.add.rectangle(W / 2, H / 2, 608, 38).setStrokeStyle(4, 0x5b3a29);
    this.load.on('progress', (p: number) => { bar.width = 600 * p; });

    const img = 'assets/img/';
    PETS.forEach(p => this.load.image(`pet-${p}`, `${img}pets/${p}.webp`));
    new Set(ALL_NODES.map(n => n.animal)).forEach(a => this.load.image(`animal-${a}`, `${img}animals/${a}.webp`));
    BACKGROUNDS.forEach(b => this.load.image(`bg-${b}`, `${img}bg/${b}.webp`));
    ['ladybird', 'basket', 'apple', 'acorn', 'gift', 'gem'].forEach(p => this.load.image(p, `${img}props/${p}.webp`));
    DECOR.forEach(d => this.load.image(`deco-${d}`, `${img}deco/${d}.webp`));
    CORE_LINES.forEach(k => this.load.audio('v_' + k, `assets/voice/${k}.mp3`));
  }

  create() {
    if (!this.textures.exists('bubble')) makeTextures(this);
    this.sound.mute = save.muted;
    // Title screen: the tap unlocks audio (browsers block sound until a touch) and goes fullscreen.
    cover(this, 'bg-map');
    this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.25);
    text(this, W / 2, 200, 'Animal Sanctuary', 120);
    new Pet(this, W / 2, 640, 380, `pet-${save.pet ?? 'fox'}`);
    const play = this.add.container(W / 2, 850);
    play.add(this.add.circle(0, 6, 90, 0x000000, 0.15));
    play.add(this.add.circle(0, 0, 90, 0x7ccf5e).setStrokeStyle(10, 0xffffff));
    // Phaser sizes a triangle from its points' positive extents, so keep them >= 0; +8 x centres it optically
    play.add(this.add.triangle(8, 0, 0, 0, 0, 84, 72, 42, 0xffffff));
    play.setSize(180, 180).setDepth(5);
    this.tweens.add({ targets: play, scale: 1.08, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    pressable(play, this, () => {
      sfx.ding(this);
      if (!this.scale.isFullscreen) this.scale.startFullscreen();
      prefetchVoice();
      session.start = Date.now();
      this.scene.start(save.pet ? 'map' : 'adopt');
    });
  }
}

/** Fetch every voice clip in the background so the service worker has them all for offline play. */
function prefetchVoice() {
  if (!import.meta.env.PROD) return;
  const keys = Object.keys(lines);
  const next = (): unknown => { const k = keys.pop(); return k && fetch(`assets/voice/${k}.mp3`).catch(() => {}).finally(next); };
  for (let i = 0; i < 3; i++) next();
}

const start = () => (window as unknown as { game: Phaser.Game }).game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W, height: H,
  backgroundColor: '#cfeec0',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 2 },
  scene: [BootScene, AdoptScene, MapScene, TenFrameScene, BubblesScene, FeedScene, CherryScene, HopScene, BeadsScene, MirrorScene, MemoryScene,
    SanctuaryScene, GrownupsScene],
});

// wait for the font so canvas text doesn't render in the fallback face
document.fonts.load(`600 40px ${FONT}`).finally(start);

if (import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
