'use strict';

// Fill the Frame: shows a partially-filled five/ten frame.
// Child picks "how many more?" from 4 choices, then watches gems fill in.

window.FillFrame = {
  init(container, config, onComplete) {
    let round = 0;
    let mistakes = 0;
    const rounds = config.rounds;

    function showRound() {
      const { given } = rounds[round];
      const target = config.target;
      const answer = target - given;

      // Generate 3 wrong choices distinct from answer and from 0..target
      const wrongs = [];
      while (wrongs.length < 3) {
        const r = Math.floor(Math.random() * (target + 1));
        if (r !== answer && !wrongs.includes(r)) wrongs.push(r);
      }
      const choices = shuffle([answer, ...wrongs]);

      const frameClass = target <= 5 ? 'frame-5' : 'frame-10';
      const slotsHtml = Array.from({length: target}, (_, i) =>
        `<div class="gem-slot ${i < given ? 'gem-filled' : 'gem-empty'}"></div>`
      ).join('');

      const choicesHtml = choices.map(c =>
        `<button class="choice-btn" data-val="${c}">${c}</button>`
      ).join('');

      container.innerHTML = `
        <div class="act-card">
          <div class="round-badge">Round ${round+1} of ${rounds.length}</div>
          <div class="act-question">How many more gems do we need?</div>
          <div class="frame-wrap">
            <div class="frame ${frameClass}" id="frame">${slotsHtml}</div>
          </div>
          <div class="choices-grid">${choicesHtml}</div>
        </div>`;

      container.querySelectorAll('.choice-btn').forEach(btn => {
        btn.onclick = () => handleChoice(+btn.dataset.val, answer, given, target, btn);
      });
      speak("How many more gems do we need to make " + target + "?");
    }

    function handleChoice(val, answer, given, target, btn) {
      if (val === answer) {
        playSound('correct', 'triangle');
        speakEncourage('correct');
        btn.classList.add('correct');
        container.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);

        // Animate filling the remaining slots
        const slots = container.querySelectorAll('.gem-slot.gem-empty');
        slots.forEach((slot, i) => {
          setTimeout(() => {
            slot.className = 'gem-slot gem-filled';
          }, 150 + i * 120);
        });

        // Glow the frame then show equation
        setTimeout(() => {
          const frame = container.querySelector('#frame');
          if (frame) {
            frame.classList.add('frame-complete');
            const eq = document.createElement('div');
            eq.style.cssText = 'font-size:clamp(1.3rem,3.5vw,2rem);font-weight:900;color:#6B21A8;animation:zoom-bounce 0.4s ease';
            eq.textContent = `${given} + ${answer} = ${target} ✨`;
            frame.parentNode.insertBefore(eq, frame.nextSibling);
          }
        }, 150 + slots.length * 120 + 100);

        setTimeout(() => {
          round++;
          if (round < rounds.length) {
            showRound();
          } else {
            const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
            onComplete(stars);
          }
        }, 150 + slots.length * 120 + 1200);
      } else {
        mistakes++;
        playSound('wrong', 'triangle');
        speakEncourage('wrong');
        btn.classList.add('wrong');
        setTimeout(() => btn.classList.remove('wrong'), 500);
      }
    }

    showRound();
  }
};

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
