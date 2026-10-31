import Phaser from 'phaser';
import '@fontsource/fredoka/600.css';
import lines from './lines.json';
import { cover, FONT, H, makeTextures, PETS, Pet, pressable, save, sfx, text, W } from './ui';
import { AdoptScene } from './scenes/adopt';
import { MapScene, NODES } from './scenes/map';
import { TenFrameScene } from './scenes/tenframe';
import { BubblesScene } from './scenes/bubbles';

class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  preload() {
    const bar = this.add.rectangle(W / 2 - 300, H / 2, 0, 30, 0x8fcf7a).setOrigin(0, 0.5);
    this.add.rectangle(W / 2, H / 2, 608, 38).setStrokeStyle(4, 0x5b3a29);
    this.load.on('progress', (p: number) => { bar.width = 600 * p; });

    const img = 'assets/img/';
    PETS.forEach(p => this.load.image(`pet-${p}`, `${img}pets/${p}.webp`));
    NODES.forEach(n => this.load.image(`animal-${n.animal}`, `${img}animals/${n.animal}.webp`));
    ['map', 'garden', 'pond', 'barn'].forEach(b => this.load.image(`bg-${b}`, `${img}bg/${b}.webp`));
    this.load.image('ladybird', `${img}props/ladybird.webp`);
    this.load.image('basket', `${img}props/basket.webp`);
    Object.keys(lines).forEach(k => this.load.audio('v_' + k, `assets/voice/${k}.mp3`));
  }

  create() {
    makeTextures(this);
    // Title screen: the tap unlocks audio (browsers block sound until a touch) and goes fullscreen.
    cover(this, 'bg-map');
    this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.25);
    text(this, W / 2, 200, 'Animal Sanctuary', 120);
    const pet = new Pet(this, W / 2, 720, 380, `pet-${save.pet ?? 'fox'}`);
    const play = this.add.container(W / 2, 850);
    play.add(this.add.circle(0, 6, 90, 0x000000, 0.15));
    play.add(this.add.circle(0, 0, 90, 0x7ccf5e).setStrokeStyle(10, 0xffffff));
    play.add(this.add.triangle(10, 0, -28, -40, -28, 40, 42, 0, 0xffffff));
    play.setSize(180, 180).setDepth(5);
    this.tweens.add({ targets: play, scale: 1.08, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    pet.img.setY(640);
    pressable(play, this, () => {
      sfx.ding(this);
      if (!this.scale.isFullscreen) this.scale.startFullscreen();
      this.scene.start(save.pet ? 'map' : 'adopt');
    });
  }
}

const start = () => (window as unknown as { game: Phaser.Game }).game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W, height: H,
  backgroundColor: '#cfeec0',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 2 },
  scene: [BootScene, AdoptScene, MapScene, TenFrameScene, BubblesScene],
});

// wait for the font so canvas text doesn't render in the fallback face
document.fonts.load(`600 40px ${FONT}`).finally(start);

if (import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
