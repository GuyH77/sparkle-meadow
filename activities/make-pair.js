'use strict';

// Make a Pair: shows an equation with a missing number (first or second addend).
// Child taps the correct choice from 4 options.

window.MakePair = {
  init(container, config, onComplete) {
    let round = 0;
    let mistakes = 0;
    const rounds = config.rounds;
    const target = config.target;
    const missing = config.missing || 'second'; // 'first': ?+a=t, 'second': a+?=t

    function showRound() {
      const { a, choices } = rounds[round];
      const answer = target - a;
      const shuffled = shuffle(choices);

      const eqHtml = missing === 'first'
        ? `<span class="eq-blank" id="blank">?</span>
           <span>+</span>
           <span>${a}</span>
           <span>=</span>
           <span>${target}</span>`
        : `<span>${a}</span>
           <span>+</span>
           <span class="eq-blank" id="blank">?</span>
           <span>=</span>
           <span>${target}</span>`;

      const choicesHtml = shuffled.map(c =>
        `<button class="choice-btn" data-val="${c}">${c}</button>`
      ).join('');

      container.innerHTML = `
        <div class="act-card">
          <div class="round-badge">Round ${round+1} of ${rounds.length}</div>
          <div class="equation">${eqHtml}</div>
          <div class="choices-grid">${choicesHtml}</div>
        </div>`;

      container.querySelectorAll('.choice-btn').forEach(btn => {
        btn.onclick = () => handleChoice(+btn.dataset.val, answer, btn);
      });
    }

    function handleChoice(val, answer, btn) {
      if (val === answer) {
        playSound('correct', 'sine');
        btn.classList.add('correct');
        container.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);

        // Fill in the blank
        const blank = container.querySelector('#blank');
        if (blank) {
          blank.className = 'eq-filled';
          blank.textContent = answer;
        }

        setTimeout(() => {
          round++;
          if (round < rounds.length) showRound();
          else onComplete(mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);
        }, 1000);
      } else {
        mistakes++;
        playSound('wrong', 'sine');
        btn.classList.add('wrong');
        setTimeout(() => btn.classList.remove('wrong'), 500);
      }
    }

    showRound();
  }
};

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
