import Phaser from 'phaser';
import { factKey, fresh, MAX_BOX } from '../engine';
import { commit, fadeTo, FONT, H, INK, roundButton, save, sfx, W } from '../ui';

// box 0 (shaky) -> 5 (fluent); unseen facts are grey
const HEAT = [0xf28b82, 0xf6ae7a, 0xfbd36b, 0xd8e57a, 0xa6dc7f, 0x5cbf6a];

/** Grown-ups only: a times-table gate, then a fact heat-map, totals, sound and reset. */
export class GrownupsScene extends Phaser.Scene {
  constructor() { super('grownups'); }

  create() {
    this.cameras.main.fadeIn(300, 255, 250, 240);
    this.add.rectangle(W / 2, H / 2, W, H, 0xfaf6ef);
    roundButton(this, 80, 80, '🏠', () => fadeTo(this, 'map'));
    this.gate();
  }

  private label(x: number, y: number, s: string, size = 36, color = INK, origin = 0.5) {
    return this.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, fontStyle: '600', color }).setOrigin(origin, 0.5);
  }

  /** ponytail: a sum a 6-year-old can't do is the whole lock; no PIN to forget. */
  private gate() {
    const a = Phaser.Math.Between(6, 9), b = Phaser.Math.Between(6, 9);
    const layer = this.add.container(0, 0);
    layer.add(this.label(W / 2, 170, 'Grown-ups only', 56));
    layer.add(this.label(W / 2, 260, `What is ${a} × ${b}?`, 48));
    let typed = '';
    const shown = this.label(W / 2, 350, '_', 64);
    layer.add(shown);
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];
    keys.forEach((k, i) => {
      const x = W / 2 + ((i % 3) - 1) * 130, y = 470 + Math.floor(i / 3) * 120;
      const btn = this.add.circle(x, y, 52, 0xffffff).setStrokeStyle(5, 0xd8c4a8).setInteractive({ useHandCursor: true });
      layer.add([btn, this.label(x, y, k, 44)]);
      btn.on('pointerup', () => {
        sfx.tap(this);
        if (k === '⌫') typed = typed.slice(0, -1);
        else if (k === '✓') {
          if (Number(typed) === a * b) { layer.destroy(); this.dashboard(); }
          else fadeTo(this, 'map');
          return;
        } else if (typed.length < 3) typed += k;
        shown.setText(typed || '_');
      });
    });
  }

  private dashboard() {
    const facts = Object.values(save.facts);
    const seen = facts.reduce((s, f) => s + f.seen, 0), right = facts.reduce((s, f) => s + f.right, 0);
    const mins = Math.round(save.playMs / 60000);
    this.label(W / 2, 70, 'How she is getting on', 52);
    this.label(W / 2, 135, `${mins} min played  ·  ${seen} questions  ·  ${seen ? Math.round((right / seen) * 100) : 0}% right first time`, 30, '#7a5a48');

    // heat-map: one row per total, one cell per fact "a + b"
    const cw = 78, ch = 52, x0 = 240, y0 = 210;
    this.label(x0 - 20, y0 - 26, 'makes', 22, '#7a5a48', 1);
    for (let t = 1; t <= 10; t++) {
      const y = y0 + (t - 1) * (ch + 6);
      this.label(x0 - 20, y + ch / 2, String(t), 30, INK, 1);
      for (let a = 0; a <= t; a++) {
        const r = save.facts[factKey(t, a)], x = x0 + a * (cw + 6);
        this.add.rectangle(x, y, cw, ch, r ? HEAT[Math.min(r.box, MAX_BOX)] : 0xe6e1d8).setOrigin(0);
        this.label(x + cw / 2, y + ch / 2, `${a}+${t - a}`, 22, r ? INK : '#a59a8c');
      }
    }
    const ly = y0 + 10 * (ch + 6) + 20;
    this.label(x0, ly, 'shaky', 22, INK, 0);
    HEAT.forEach((c, i) => this.add.rectangle(x0 + 80 + i * 44, ly - 14, 40, 28, c).setOrigin(0));
    this.label(x0 + 80 + HEAT.length * 44 + 10, ly, 'fluent    grey = not tried yet', 22, INK, 0);

    // what to practise
    const weak = Object.entries(save.facts).filter(([, r]) => r.seen > 0).sort((p, q) => p[1].box - q[1].box || q[1].seen - p[1].seen).slice(0, 5);
    const wx = 1390;
    this.label(wx, 230, 'Needs practice', 34);
    weak.forEach(([k], i) => { const [t, a] = k.split(':').map(Number); this.label(wx, 290 + i * 50, `${a} + ${t - a} = ${t}`, 32, '#b04a3a'); });
    if (!weak.length) this.label(wx, 290, 'Nothing yet', 28, '#a59a8c');

    const LIMITS = [0, 10, 15, 20, 30];
    const limitLabel = () => (save.limitMin ? `⏱️ Rest after ${save.limitMin} min` : '⏱️ No time limit');
    const limitBtn = this.button(wx, 540, limitLabel(), () => {
      save.limitMin = LIMITS[(LIMITS.indexOf(save.limitMin) + 1) % LIMITS.length]; commit();
      limitBtn.setText(limitLabel());
    });
    const soundBtn = this.button(wx, 625, save.muted ? '🔇 Sound off' : '🔊 Sound on', () => {
      save.muted = !save.muted; this.sound.mute = save.muted; commit();
      soundBtn.setText(save.muted ? '🔇 Sound off' : '🔊 Sound on');
    });
    this.button(wx, 710, '💾 Save a backup', () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(save)], { type: 'application/json' }));
      a.download = `sanctuary-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
    const importBtn = this.button(wx, 795, '📂 Load a backup', () => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = '.json,application/json';
      input.onchange = async () => {
        try {
          const data = JSON.parse(await input.files![0].text());
          // only accept something that looks like our save
          if (typeof data !== 'object' || !data.nodes || !data.facts) throw new Error('not a backup');
          Object.assign(save, fresh(), data); commit();
          fadeTo(this, 'boot');
        } catch { importBtn.setText('Not a backup file'); importBtn.setColor('#c0392b'); }
      };
      input.click();
    });
    let armed = false;
    const reset = this.button(wx, 880, 'Reset progress', () => {
      if (!armed) { armed = true; reset.setText('Tap again to reset'); reset.setColor('#c0392b'); return; }
      Object.assign(save, fresh()); commit();
      fadeTo(this, 'boot');
    });
  }

  private button(x: number, y: number, s: string, onTap: () => void) {
    const bg = this.add.rectangle(x, y, 340, 74, 0xffffff).setStrokeStyle(4, 0xd8c4a8).setInteractive({ useHandCursor: true });
    const t = this.label(x, y, s, 30);
    bg.on('pointerup', () => { sfx.tap(this); onTap(); });
    return t;
  }
}
