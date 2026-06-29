'use strict';

// Place Value: shows a number, child uses + / - buttons to set tens and ones,
// then taps Check to verify. Visual wands (tens) and gems (ones) update live.

window.PlaceValue = {
  init(container, config, onComplete) {
    let round = 0;
    let mistakes = 0;
    const rounds = config.rounds;

    function showRound() {
      const { n } = rounds[round];
      const maxTens = Math.floor(n / 10);
      const maxOnes = n % 10 === 0 ? 9 : 9; // allow overcounting to discover wrong
      let tens = 0;
      let ones = 0;

      function render(feedback) {
        const wandsHtml = Array.from({length: tens}, () =>
          `<div class="pv-wand"></div>`
        ).join('');
        const gemsHtml = Array.from({length: ones}, () =>
          `<div class="pv-gem"></div>`
        ).join('');

        container.innerHTML = `
          <div class="act-card">
            <div class="round-badge">Round ${round+1} of ${rounds.length}</div>
            <div class="act-question">What is <span class="pv-target">${n}</span> made of?</div>
            <div class="pv-groups">
              <div class="pv-group">
                <div class="pv-label">🪄 Tens</div>
                <div class="pv-controls">
                  <button class="pv-btn pv-btn-sub" id="tsub" ${tens<=0?'disabled':''}>−</button>
                  <div class="pv-count">${tens}</div>
                  <button class="pv-btn pv-btn-add" id="tadd" ${tens>=9?'disabled':''}>+</button>
                </div>
                <div class="pv-visual">${wandsHtml}</div>
              </div>
              <div class="pv-group">
                <div class="pv-label">💎 Ones</div>
                <div class="pv-controls">
                  <button class="pv-btn pv-btn-sub" id="osub" ${ones<=0?'disabled':''}>−</button>
                  <div class="pv-count">${ones}</div>
                  <button class="pv-btn pv-btn-add" id="oadd" ${ones>=9?'disabled':''}>+</button>
                </div>
                <div class="pv-visual">${gemsHtml}</div>
              </div>
            </div>
            <div class="pv-feedback">${feedback || ''}</div>
            <button class="btn btn-green pv-check" id="check">Check ✓</button>
          </div>`;

        container.querySelector('#tadd').onclick = () => { tens = Math.min(tens+1, 9); render(); };
        container.querySelector('#tsub').onclick = () => { tens = Math.max(tens-1, 0); render(); };
        container.querySelector('#oadd').onclick = () => { ones = Math.min(ones+1, 9); render(); };
        container.querySelector('#osub').onclick = () => { ones = Math.max(ones-1, 0); render(); };
        container.querySelector('#check').onclick = () => {
          if (tens * 10 + ones === n) {
            playSound('correct', 'sine');
            render(`✅ Yes! ${tens} tens and ${ones} ones = ${n}!`);
            container.querySelector('#check').disabled = true;
            setTimeout(() => {
              round++;
              if (round < rounds.length) showRound();
              else onComplete(mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);
            }, 1400);
          } else {
            mistakes++;
            playSound('wrong', 'sine');
            render(`Not quite — ${tens} tens and ${ones} ones = ${tens*10+ones}. Try again! 🌟`);
          }
        };
      }

      render();
    }

    showRound();
  }
};
