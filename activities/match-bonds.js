'use strict';

// Match Bonds: tap two cards that sum to the target. Matched pairs disappear.

window.MatchBonds = {
  init(container, config, onComplete) {
    const target = config.target;
    let mistakes = 0;
    let selectedIdx = null;

    // Build flat card list: each pair gets two card entries with unique indices
    const cards = [];
    config.pairs.forEach(([a, b]) => {
      cards.push({ val: a, matched: false });
      cards.push({ val: b, matched: false });
    });
    shuffle(cards);

    speak("Match the numbers that add up to " + target + "!");

    function render() {
      const gridCols = cards.length <= 8 ? 4 : 5;
      const cardsHtml = cards.map((c, i) => {
        const cls = c.matched ? 'match-card matched' : 'match-card';
        return c.matched
          ? `<div class="${cls}">✓</div>`
          : `<div class="${cls}" data-idx="${i}">${c.val}</div>`;
      }).join('');

      container.innerHTML = `
        <div class="act-card">
          <div class="match-target">Find pairs that make <strong>${target}</strong> ✨</div>
          <div class="match-grid" style="grid-template-columns:repeat(${gridCols},1fr)">${cardsHtml}</div>
        </div>`;

      container.querySelectorAll('.match-card:not(.matched)').forEach(el => {
        el.onclick = () => handleTap(+el.dataset.idx, el);
      });

      // Re-apply selected highlight
      if (selectedIdx !== null) {
        const sel = container.querySelector(`[data-idx="${selectedIdx}"]`);
        if (sel) sel.classList.add('selected');
      }
    }

    function handleTap(idx, el) {
      if (cards[idx].matched) return;
      if (selectedIdx === null) {
        selectedIdx = idx;
        el.classList.add('selected');
        return;
      }
      if (selectedIdx === idx) {
        // Deselect
        selectedIdx = null;
        el.classList.remove('selected');
        return;
      }

      const a = cards[selectedIdx].val;
      const b = cards[idx].val;
      const prevIdx = selectedIdx;
      selectedIdx = null;

      if (a + b === target) {
        playSound('correct', 'triangle');
        speakEncourage('correct');
        cards[prevIdx].matched = true;
        cards[idx].matched = true;
        render();

        if (cards.every(c => c.matched)) {
          setTimeout(() => onComplete(mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1), 600);
        }
      } else {
        mistakes++;
        playSound('wrong', 'triangle');
        speakEncourage('wrong');
        // Flash wrong on both
        const prevEl = container.querySelector(`[data-idx="${prevIdx}"]`);
        [prevEl, el].forEach(e => {
          if (e) { e.classList.add('wrong'); setTimeout(() => e.classList.remove('wrong'), 500); }
        });
        setTimeout(render, 50); // re-render to clear selected state
      }
    }

    render();
  }
};

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
