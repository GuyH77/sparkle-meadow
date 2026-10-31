import Phaser from 'phaser';
import { Fact, stage } from '../engine';
import { RoundScene } from '../round';
import { save, say, sfx, text, W } from '../ui';

const GAP = 14;

/**
 * Ten-frame (or five-frame) bonds. Stage per fact (from the engine):
 *  0 concrete  - drag ladybirds to fill the frame, then "how many did you add?"
 *  1 pictorial - frame shown, pick the missing number
 *  2 abstract  - "a + ? = total", frame only appears as a hint after a mistake
 */
export class TenFrameScene extends RoundScene {
  bg = 'bg-garden';
  private shownFillHelp = false;
  constructor() { super('tenframe'); }

  begin() { this.shownFillHelp = false; this.next(); }

  ask([total, a]: Fact) {
    // up to 20: a double ten-frame (two 2x5 frames side by side); dragging 20 bugs is too fiddly, so no concrete stage
    const big = total > 10, CELL = big ? 100 : 128, cols = big ? 10 : 5, rows = big ? 2 : total / 5, SPLIT = big ? 44 : 0;
    const b = total - a, st = big ? Math.max(1, stage(save, total, a)) as 1 | 2 : stage(save, total, a), L = this.layer;
    const fw = cols * CELL + (cols - 1) * GAP + SPLIT, fh = rows * CELL + (rows - 1) * GAP;
    const fx = W / 2 - fw / 2, fy = (st === 0 ? 330 : 360) - fh / 2;

    const board = this.add.graphics();
    board.fillStyle(0x000000, 0.12).fillRoundedRect(fx - 26, fy - 18, fw + 52, fh + 52, 30);
    board.fillStyle(0xfff6e0).fillRoundedRect(fx - 26, fy - 26, fw + 52, fh + 52, 30);
    board.lineStyle(8, 0xc98a4b).strokeRoundedRect(fx - 26, fy - 26, fw + 52, fh + 52, 30);
    const frame = this.add.container(0, 0, [board]);
    L.add(frame);
    const cells = [...Array(total)].map((_, i) => {
      const col = big ? (i % 10) % 5 + Math.floor(i / 10) * 5 : i % 5, row = big ? Math.floor((i % 10) / 5) : Math.floor(i / 5);
      const x = fx + col * (CELL + GAP) + (col >= 5 ? SPLIT : 0) + CELL / 2, y = fy + row * (CELL + GAP) + CELL / 2;
      const r = this.add.rectangle(x, y, CELL, CELL, 0xffffff).setStrokeStyle(5, 0xe2b98a);
      frame.add(r);
      return { x, y, r, filled: i < a, mine: false };
    });
    const bugW = this.textures.get('ladybird').getSourceImage().width;
    const bugScale = (f: number) => (CELL * f) / bugW;
    const bug = (x: number, y: number) => this.add.image(x, y, 'ladybird').setScale(bugScale(0.78));
    cells.slice(0, a).forEach((c, i) => {
      const s = bug(c.x, c.y - 300).setAlpha(0);
      frame.add(s);
      this.tweens.add({ targets: s, y: c.y, alpha: 1, duration: 350, delay: i * 90, ease: 'Bounce.out', onStart: () => sfx.drop(this) });
    });
    if (st === 2) {
      frame.setAlpha(0);
      L.add(text(this, W / 2, 380, `${a} + ? = ${total}`, 150));
    }

    const empty = () => cells.filter(c => !c.filled);
    // the cells that hold the answer: still-empty ones, or (concrete) the ones she filled herself
    const gaps = () => st === 0 ? cells.filter(c => c.mine) : empty();
    const showCards = (prompt: string) => this.options({
      fact: [total, a], answer: b, max: total, count: st === 2 ? 4 : 3, prompt, rightLine: `bond_${total}_${a}`,
      also: [a], hintLine: 'tf_hint',
      hint: () => {
        if (frame.alpha < 1) this.tweens.add({ targets: frame, alpha: 1, duration: 400 });
        gaps().forEach(c => { c.r.setStrokeStyle(8, 0xf2b705); this.tweens.add({ targets: c.r, scale: 1.1, duration: 250, yoyo: true, repeat: 3 }); });
      },
      demo: () => {
        const g = gaps();
        return this.countAloud(g.length, i => {
          if (st === 0) { this.tweens.add({ targets: g[i].r, scale: 1.12, duration: 150, yoyo: true }); return; }
          const s = bug(g[i].x, g[i].y).setAlpha(0.8); frame.add(s);
          this.tweens.add({ targets: s, scale: { from: 0, to: s.scale }, duration: 200, ease: 'Back.out' });
        });
      },
      // reveal the whole bond: ghost ladybirds fill the gaps
      onRight: () => {
        if (st === 0) return;
        frame.setAlpha(1);
        empty().forEach((c, i) => { const s = bug(c.x, c.y).setAlpha(0); frame.add(s); this.tweens.add({ targets: s, alpha: 0.85, delay: i * 70, duration: 200 }); });
      },
    });

    const intro = a * 90 + 300;
    if (st > 0) { this.time.delayedCall(intro, () => showCards(`more_${total}_${a}`)); return; }

    // concrete: drag ladybirds from the leaf pile into the empty cells
    L.add(this.add.ellipse(W - 330, 560, 420, 260, 0x8fd16a).setStrokeStyle(8, 0x5ea644));
    const lines = [`more_${total}_${a}`];
    if (!this.shownFillHelp) { lines.push('tf_fill'); this.shownFillHelp = true; }
    this.time.delayedCall(intro, () => say(this, ...lines));
    if (b === 0) { this.time.delayedCall(intro + 600, () => showCards('tf_added')); return; }
    const pile: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < total; i++) {
      // loose grid on the leaf so the bugs don't pile on top of each other
      const hx = W - 330 + ((i % 5) - 2) * 72 + Phaser.Math.Between(-10, 10);
      const hy = 560 + (Math.floor(i / 5) - (total / 5 - 1) / 2) * 95 + Phaser.Math.Between(-15, 15);
      const s = bug(hx, hy).setScale(bugScale(0.7)).setAngle(Phaser.Math.Between(-30, 30));
      s.setInteractive({ draggable: true, useHandCursor: true });
      L.add(s); pile.push(s);
      s.on('dragstart', () => { L.bringToTop(s); s.setScale(bugScale(0.8)); sfx.tap(this); });
      s.on('drag', (_: unknown, x: number, y: number) => s.setPosition(x, y));
      s.on('dragend', () => {
        s.setScale(bugScale(0.7));
        const target = empty().map(c => ({ c, d: Phaser.Math.Distance.Between(c.x, c.y, s.x, s.y) })).sort((p, q) => p.d - q.d)[0];
        if (!target || target.d >= CELL) { this.tweens.add({ targets: s, x: hx, y: hy, duration: 250, ease: 'Quad.out' }); return; }
        target.c.filled = target.c.mine = true;
        target.c.r.setFillStyle(0xd6f5c0); // her added ones stay visibly different, so she can count them
        s.disableInteractive();
        this.tweens.add({ targets: s, x: target.c.x, y: target.c.y, angle: 0, scale: bugScale(0.78), duration: 150 });
        sfx.drop(this);
        if (empty().length === 0) {
          sfx.ding(this);
          pile.forEach(p => p.disableInteractive());
          this.time.delayedCall(500, () => showCards('tf_added'));
        }
      });
    }
  }
}
