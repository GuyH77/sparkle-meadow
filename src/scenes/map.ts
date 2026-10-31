import Phaser from 'phaser';
import { burst, confetti, cover, fadeTo, Pet, roundButton, save, say, sfx, text, W } from '../ui';
import { MapNode, Realm, REALMS, realmDone, realmOpen } from '../world';

const R = 72; // node badge radius
let lastRealm = REALMS[0].id;

const done = (n: MapNode) => !!save.nodes[n.id];

/** A realm map: colour returns as stops are completed; rescued animals move in beside their stop. */
export class MapScene extends Phaser.Scene {
  private pet!: Pet;
  private realm!: Realm;
  constructor() { super('map'); }

  create(data: { realm?: string; intro?: boolean; justDone?: string; newly?: boolean }) {
    this.realm = REALMS.find(r => r.id === (data.realm ?? lastRealm)) ?? REALMS[0];
    lastRealm = this.realm.id;
    const realm = this.realm, nodes = realm.nodes;
    const unlocked = (i: number) => i === 0 || done(nodes[i - 1]);
    this.cameras.main.fadeIn(400, 255, 250, 240);

    const bg = cover(this, realm.bg);
    const colour = bg.preFX?.addColorMatrix();
    const progress = () => nodes.filter(done).length / nodes.length;
    const setColour = (p: number) => { colour?.saturate(-(1 - p) * 0.85); };
    const newly = data.newly ? nodes.find(n => n.id === data.justDone) : undefined;
    const shown = progress() - (newly ? 1 / nodes.length : 0);
    setColour(shown);

    this.drawPath(nodes);
    const animals = new Map<string, Phaser.GameObjects.Image>();
    nodes.forEach((n, i) => {
      this.drawNode(n, unlocked(i));
      if (done(n)) {
        const a = this.addAnimal(n);
        animals.set(n.id, a);
        if (n === newly) a.setScale(0);
      }
    });

    const current = nodes.find((n, i) => unlocked(i) && !done(n)) ?? nodes[nodes.length - 1];
    this.pet = new Pet(this, current.x - 120, current.y + 50, 170);
    this.pet.img.setDepth(20);

    roundButton(this, 80, 80, '🏡', () => fadeTo(this, 'sanctuary'));
    roundButton(this, W - 60, 60, '⚙️', () => fadeTo(this, 'grownups'), 36).setAlpha(0.7);
    const i = REALMS.indexOf(realm), prev = REALMS[i - 1], next = REALMS[i + 1];
    if (prev) roundButton(this, 80, 220, '⬅️', () => fadeTo(this, 'map', { realm: prev.id }));
    const nextOpen = !!next && realmOpen(next, save.nodes);
    if (nextOpen) {
      const firstVisit = !next.nodes.some(n => save.nodes[n.id]);
      const sign = roundButton(this, W - 110, 250, '🌲', () => fadeTo(this, 'map', { realm: next.id, intro: firstVisit }), 70);
      this.tweens.add({ targets: sign, angle: { from: -6, to: 6 }, duration: 600, yoyo: true, repeat: -1 });
    }

    if (newly) {
      const a = animals.get(newly.id)!;
      this.time.delayedCall(500, () => {
        sfx.sparkle(this);
        this.tweens.add({ targets: a, scale: 130 / a.height, duration: 600, ease: 'Back.out' });
        burst(this, a.x, a.y - 60, 40);
        this.tweens.addCounter({ from: shown, to: progress(), duration: 1800, onUpdate: t => setColour(t.getValue() ?? 0) });
        this.pet.hop(2);
        const lines = [`rescued_${newly.animal}`];
        if (realmDone(realm, save.nodes)) {
          lines.push(realm.done);
          if (next) lines.push('to_forest');
          this.time.delayedCall(2500, () => { confetti(this); sfx.fanfare(this); });
        } else lines.push('map_pick');
        say(this, ...lines);
      });
    } else if (data.intro) {
      this.time.delayedCall(400, () => say(this, realm.intro, 'map_pick'));
    } else {
      this.time.delayedCall(400, () => say(this, realmDone(realm, save.nodes) && nextOpen ? 'to_forest' : 'map_pick'));
    }
  }

  /** Stepping-stone dots along a smooth curve through the stops. */
  private drawPath(nodes: MapNode[]) {
    const curve = new Phaser.Curves.Spline(nodes.map(n => new Phaser.Math.Vector2(n.x, n.y)));
    const g = this.add.graphics().setDepth(5);
    curve.getSpacedPoints(Math.round(curve.getLength() / 38)).forEach(p => {
      if (nodes.some(n => Phaser.Math.Distance.Between(n.x, n.y, p.x, p.y) < R + 10)) return;
      g.fillStyle(0x000000, 0.15).fillCircle(p.x + 2, p.y + 4, 10);
      g.fillStyle(0xfff6e0).fillCircle(p.x, p.y, 10);
    });
  }

  private addAnimal(n: MapNode) {
    const a = this.add.image(n.x + 95, n.y - 35, `animal-${n.animal}`).setOrigin(0.5, 1).setDepth(15);
    a.setScale(130 / a.height);
    this.tweens.add({ targets: a, scaleY: a.scaleY * 1.04, duration: 900 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    return a;
  }

  private drawNode(n: MapNode, open: boolean) {
    const isDone = done(n);
    const c = this.add.container(n.x, n.y).setDepth(10);
    c.add(this.add.circle(0, 7, R, 0x000000, 0.18));
    c.add(this.add.circle(0, 0, R, isDone ? 0xfff4c2 : open ? 0xffffff : 0xd9d9d9).setStrokeStyle(9, isDone ? 0xf2b705 : open ? 0x7ccf5e : 0xa8a8a8));
    const pic = this.add.image(0, 4, `animal-${n.animal}`);
    pic.setScale(100 / Math.max(pic.width, pic.height));
    if (!isDone) pic.setTintFill(open ? 0x8a7a6e : 0xb5b5b5).setAlpha(0.7); // silhouette until rescued
    c.add(pic);
    if (n.parts && !isDone) c.add(text(this, 0, -R - 6, '⛈️', 44));
    if (!open) c.add(text(this, 44, 44, '🔒', 40));

    const stars = save.nodes[n.id] ?? 0;
    if (isDone) for (let s = 0; s < 3; s++) {
      const st = this.add.image((s - 1) * 44, R + 22, 'bigstar').setScale(0.33);
      if (s >= stars) st.setTint(0xbbbbbb).setAlpha(0.6);
      c.add(st);
    }
    if (open && !isDone) this.tweens.add({ targets: c, scale: 1.1, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    c.setSize(R * 2 + 20, R * 2 + 20).setInteractive({ useHandCursor: true }).on('pointerup', () => {
      if (!open) { sfx.boop(this); this.pet.tilt(); return; }
      sfx.tap(this);
      this.input.enabled = false;
      this.pet.moveTo(n.x - 100, n.y + 50, () => {
        this.cameras.main.fadeOut(350, 255, 250, 240);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(n.parts ? n.parts[0].game : n.game, { node: n }));
      });
    });
  }
}
