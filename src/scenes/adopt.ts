import Phaser from 'phaser';
import { burst, commit, confetti, cover, fadeTo, PETS, Pet, save, say, sfx, W } from '../ui';

/** First launch: four pets peek out of baskets in the barn; she taps one to adopt it. */
export class AdoptScene extends Phaser.Scene {
  constructor() { super('adopt'); }

  create() {
    this.cameras.main.fadeIn(400, 255, 250, 240);
    cover(this, 'bg-barn');
    let chosen = false;
    const all: Phaser.GameObjects.Image[] = [];

    PETS.forEach((p, i) => {
      const x = W / 2 + (i - (PETS.length - 1) / 2) * 370, y = 860;
      const pet = new Pet(this, x, y - 60, 270, `pet-${p}`);
      const basket = this.add.image(x, y, 'basket').setOrigin(0.5, 1);
      basket.setScale(320 / basket.width);
      all.push(pet.img, basket);
      // basket hides the pet's lower half; pet bobs up to peek out
      this.tweens.add({ targets: pet.img, y: y - 190, duration: 900, delay: i * 300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

      const pick = () => {
        if (chosen) return;
        chosen = true;
        save.pet = p; commit();
        sfx.sparkle(this);
        this.tweens.killTweensOf(pet.img);
        pet.img.setDepth(10);
        this.tweens.add({ targets: pet.img, y: y - 380, duration: 450, ease: 'Quad.out', yoyo: true, hold: 150 });
        this.time.delayedCall(450, () => burst(this, x, y - 500, 40));
        this.tweens.add({ targets: all.filter(o => o !== pet.img && o !== basket), alpha: 0, duration: 500 });
        confetti(this);
        say(this, 'adopt_yay').then(() => fadeTo(this, 'map', { intro: true }));
      };
      basket.setInteractive({ useHandCursor: true }).on('pointerup', pick);
      pet.img.setInteractive({ useHandCursor: true }).on('pointerup', pick);
    });

    this.time.delayedCall(500, () => say(this, 'hello_choose'));
  }
}
