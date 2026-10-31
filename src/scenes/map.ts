import Phaser from 'phaser';
import { burst, confetti, cover, Pet, save, say, sfx, text } from '../ui';

export type MapNode = { id: string; game: 'tenframe' | 'bubbles'; total: number; animal: string; x: number; y: number; ax: number; ay: number };

// x,y = node badge on the path; ax,ay = where the rescued animal lives afterwards
export const NODES: MapNode[] = [
  { id: 'meadow-1', game: 'tenframe', total: 5, animal: 'lamb', x: 760, y: 850, ax: 1010, ay: 940 },
  { id: 'meadow-2', game: 'tenframe', total: 10, animal: 'duckling', x: 820, y: 615, ax: 1080, ay: 700 },
  { id: 'meadow-3', game: 'bubbles', total: 10, animal: 'hedgehog', x: 440, y: 545, ax: 230, ay: 720 },
];

const done = (n: MapNode) => !!save.nodes[n.id];
const unlocked = (i: number) => i === 0 || done(NODES[i - 1]);

/** Meadow map: colour returns as nodes are completed; rescued animals move in. */
export class MapScene extends Phaser.Scene {
  private pet!: Pet;
  constructor() { super('map'); }

  create(data: { intro?: boolean; justDone?: string; newly?: boolean }) {
    this.cameras.main.fadeIn(400, 255, 250, 240);
    const bg = cover(this, 'bg-map');
    const colour = bg.preFX?.addColorMatrix();
    const progress = () => NODES.filter(done).length / NODES.length;
    const setColour = (p: number) => { colour?.saturate(-(1 - p) * 0.85); };
    const newly = data.newly ? NODES.find(n => n.id === data.justDone) : undefined;
    let shown = progress() - (newly ? 1 / NODES.length : 0);
    setColour(shown);

    const animals = new Map<string, Phaser.GameObjects.Image>();
    NODES.forEach((n, i) => {
      this.drawNode(n, i);
      if (done(n)) {
        const a = this.addAnimal(n);
        animals.set(n.id, a);
        if (n === newly) a.setScale(0);
      }
    });

    const current = NODES.find((n, i) => unlocked(i) && !done(n)) ?? NODES[NODES.length - 1];
    const pet = new Pet(this, current.x - 190, current.y + 80, 200);
    pet.img.setDepth(20);
    this.pet = pet;

    if (newly) {
      const a = animals.get(newly.id)!;
      this.time.delayedCall(500, () => {
        sfx.sparkle(this);
        const target = 150 / a.height;
        this.tweens.add({ targets: a, scale: target, duration: 600, ease: 'Back.out' });
        burst(this, a.x, a.y - 60, 40);
        this.tweens.addCounter({ from: shown, to: progress(), duration: 1800, onUpdate: t => setColour(t.getValue() ?? 0) });
        pet.hop(2);
        const lines = [`rescued_${newly.animal}`];
        if (progress() === 1) { lines.push('meadow_done'); this.time.delayedCall(2500, () => { confetti(this); sfx.fanfare(this); }); }
        else lines.push('map_pick');
        say(this, ...lines);
      });
    } else if (data.intro) {
      this.time.delayedCall(400, () => say(this, 'map_intro', 'map_pick'));
    } else {
      this.time.delayedCall(400, () => say(this, 'map_pick'));
    }
  }

  private addAnimal(n: MapNode) {
    const a = this.add.image(n.ax, n.ay, `animal-${n.animal}`).setOrigin(0.5, 1).setDepth(15);
    a.setScale(150 / a.height);
    this.tweens.add({ targets: a, scaleY: a.scaleY * 1.04, duration: 900 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    return a;
  }

  private drawNode(n: MapNode, i: number) {
    const open = unlocked(i), isDone = done(n);
    const c = this.add.container(n.x, n.y).setDepth(10);
    c.add(this.add.circle(0, 8, 88, 0x000000, 0.18));
    c.add(this.add.circle(0, 0, 88, isDone ? 0xfff4c2 : open ? 0xffffff : 0xd9d9d9).setStrokeStyle(10, isDone ? 0xf2b705 : open ? 0x7ccf5e : 0xa8a8a8));
    const pic = this.add.image(0, 6, `animal-${n.animal}`);
    pic.setScale(120 / Math.max(pic.width, pic.height));
    if (!isDone) pic.setTintFill(open ? 0x8a7a6e : 0xb5b5b5).setAlpha(0.7); // silhouette until rescued
    c.add(pic);
    if (!open) c.add(text(this, 52, 52, '🔒', 48));

    const stars = save.nodes[n.id] ?? 0;
    if (isDone) for (let s = 0; s < 3; s++) {
      const st = this.add.image((s - 1) * 52, 112, 'bigstar').setScale(0.4);
      if (s >= stars) st.setTint(0xbbbbbb).setAlpha(0.6);
      c.add(st);
    }
    if (open && !isDone) this.tweens.add({ targets: c, scale: 1.1, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    c.setSize(190, 190).setInteractive({ useHandCursor: true }).on('pointerup', () => {
      const pet = this.pet;
      if (!open) { sfx.boop(this); pet.tilt(); return; }
      sfx.tap(this);
      this.input.enabled = false;
      pet.moveTo(n.x - 110, n.y + 70, () => {
        this.cameras.main.fadeOut(350, 255, 250, 240);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(n.game, { node: n }));
      });
    });
  }
}
