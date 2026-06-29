'use strict';

// ====== LEVEL DATA ======
const LEVELS = [
  {
    id: 1, name: "Tiny Blooms", emoji: "🌸", color: "#F472B6", bond: "Bonds to 5",
    gemFrom: '#FCA5A5', gemTo: '#E11D48',
    bgFrom: '#FFF1F2', bgTo: '#FECDD3',
    rootHz: 523,
    activities: [
      { type: "fill-frame", target: 5, rounds: [{given:2},{given:4},{given:1}] },
      { type: "make-pair", target: 5, rounds: [
        { a:1, choices:[2,4,3,5] },
        { a:3, choices:[1,2,4,3] },
        { a:4, choices:[2,1,5,3] },
      ]},
    ]
  },
  {
    id: 2, name: "Rainbow Bridge", emoji: "🌈", color: "#A855F7", bond: "Bonds to 10",
    gemFrom: '#C4B5FD', gemTo: '#7C3AED',
    bgFrom: '#F5F3FF', bgTo: '#EDE9FE',
    rootHz: 392,
    activities: [
      { type: "fill-frame", target: 10, rounds: [{given:3},{given:7},{given:5}] },
      { type: "fill-frame", target: 10, rounds: [{given:8},{given:2},{given:6}] },
      { type: "match-bonds", target: 10, pairs: [[1,9],[2,8],[3,7],[4,6]] },
    ]
  },
  {
    id: 3, name: "Starlight Garden", emoji: "⭐", color: "#6366F1", bond: "Bonds to 20",
    gemFrom: '#93C5FD', gemTo: '#1D4ED8',
    bgFrom: '#EFF6FF', bgTo: '#DBEAFE',
    rootHz: 440,
    activities: [
      { type: "make-pair", target: 20, rounds: [
        { a:12, choices:[6,8,10,5]    },
        { a:7,  choices:[11,13,15,12] },
        { a:15, choices:[3,5,7,4]    },
      ]},
      { type: "make-pair", target: 20, rounds: [
        { a:3,  choices:[15,17,14,18] },
        { a:18, choices:[1,2,3,4]    },
        { a:11, choices:[7,9,11,8]   },
      ]},
      { type: "match-bonds", target: 20, pairs: [[2,18],[5,15],[8,12],[11,9],[14,6]] },
    ]
  },
  {
    id: 4, name: "Crystal Cave", emoji: "💎", color: "#0EA5E9", bond: "Missing bonds",
    gemFrom: '#67E8F9', gemTo: '#0284C7',
    bgFrom: '#F0F9FF', bgTo: '#BAE6FD',
    rootHz: 349,
    activities: [
      { type: "make-pair", target: 10, missing: "first", rounds: [
        { a:3, choices:[5,6,7,8] },
        { a:6, choices:[3,4,5,6] },
        { a:9, choices:[1,2,3,4] },
      ]},
      { type: "make-pair", target: 10, missing: "second", rounds: [
        { a:2, choices:[6,7,8,9] },
        { a:5, choices:[3,4,5,6] },
        { a:7, choices:[1,2,3,4] },
      ]},
      { type: "match-bonds", target: 10, pairs: [[1,9],[2,8],[3,7],[4,6],[5,5]] },
    ]
  },
  {
    id: 5, name: "Golden Tower", emoji: "🏰", color: "#F59E0B", bond: "Tens & ones to 20",
    gemFrom: '#FDE68A', gemTo: '#D97706',
    bgFrom: '#FFFBEB', bgTo: '#FEF3C7',
    rootHz: 587,
    activities: [
      { type: "place-value", rounds: [{n:13},{n:17},{n:11}] },
      { type: "place-value", rounds: [{n:15},{n:19},{n:12}] },
      { type: "place-value", rounds: [{n:14},{n:16},{n:18}] },
    ]
  },
  {
    id: 6, name: "Diamond Palace", emoji: "✨", color: "#10B981", bond: "Tens & ones to 99",
    gemFrom: '#6EE7B7', gemTo: '#059669',
    bgFrom: '#ECFDF5', bgTo: '#D1FAE5',
    rootHz: 659,
    activities: [
      { type: "place-value", rounds: [{n:24},{n:37},{n:52}] },
      { type: "place-value", rounds: [{n:63},{n:48},{n:71}] },
      { type: "place-value", rounds: [{n:35},{n:86},{n:99}] },
    ]
  },
];

const AVATARS = ['🦄','🐬','🦋','🌟','🦊','🐉'];
const PROFILE_COLORS = ['#F472B6','#A855F7','#6366F1','#0EA5E9','#F59E0B','#10B981'];

// ====== PROGRESS (multi-profile) ======
function freshProgress() {
  return { profiles: [{ name: '', unlocked: 1, stars: {} }], active: 0 };
}

function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem('sparkle-v1'));
    if (!raw) return freshProgress();
    // Migrate old single-profile format
    if (!raw.profiles) {
      return { profiles: [{ name: raw.name || '', unlocked: raw.unlocked || 1, stars: raw.stars || {} }], active: 0 };
    }
    return raw;
  } catch { return freshProgress(); }
}

function saveProgress() {
  try { localStorage.setItem('sparkle-v1', JSON.stringify(progress)); } catch {}
}

function currentProfile() { return progress.profiles[progress.active]; }
function actKey(levelId, actIdx) { return `${levelId}-${actIdx}`; }

function totalStars() {
  return Object.values(currentProfile().stars).reduce((s, v) => s + v, 0);
}
function levelStars(levelId) {
  const level = LEVELS.find(l => l.id === levelId);
  return level.activities.reduce((s, _, i) => s + (currentProfile().stars[actKey(levelId, i)] || 0), 0);
}

let progress = loadProgress();

// ====== LEVEL THEME ======
function setLevelTheme(level) {
  const r = document.documentElement.style;
  r.setProperty('--bg-from', level.bgFrom);
  r.setProperty('--bg-to', level.bgTo);
  r.setProperty('--gem-from', level.gemFrom);
  r.setProperty('--gem-to', level.gemTo);
  r.setProperty('--level-accent', level.color);
  window.gameLevel = level;
}
function clearLevelTheme() {
  ['--bg-from','--bg-to','--gem-from','--gem-to','--level-accent']
    .forEach(v => document.documentElement.style.removeProperty(v));
  window.gameLevel = null;
}

// ====== SPEECH ======
window.speak = function(text) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.88; u.pitch = 1.15; u.lang = 'en-GB';
    synth.speak(u);
  } catch {}
  const bubble = document.getElementById('uni-bubble');
  if (!bubble) return;
  bubble.textContent = text;
  bubble.classList.add('visible');
  clearTimeout(bubble._t);
  bubble._t = setTimeout(() => bubble.classList.remove('visible'), 3800);
};

const _encourage = {
  correct: ['Amazing! ⭐', "You're a star! 🌟", 'Well done! 🎉', 'Brilliant! ✨', "That's right! 💫"],
  wrong:   ['Try again! 💪', 'Almost there! 🌟', 'Have another go! ✨', 'You can do it! 🦄'],
};
window.speakEncourage = function(type) {
  const arr = _encourage[type] || _encourage.correct;
  speak(arr[Math.floor(Math.random() * arr.length)]);
};

// ====== SOUND ======
window.playSound = function(type, voice) {
  try {
    voice = voice || 'sine';
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const root = (window.gameLevel && window.gameLevel.rootHz) || 523;

    function note(freq, start, dur, vol) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = voice;
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.2, ctx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur + 0.05);
    }

    if (type === 'correct') {
      note(root, 0, 0.18);
      note(root * 1.5, 0.14, 0.25);
    } else if (type === 'wrong') {
      note(root * 0.67, 0, 0.14, 0.15);
      note(root * 0.56, 0.14, 0.22, 0.12);
    } else if (type === 'celebrate') {
      const stars = window.lastStars || 1;
      const ratios = stars === 3
        ? [1, 1.26, 1.5, 2, 2.52, 3, 4]
        : stars === 2 ? [1, 1.26, 1.5, 2]
        : [1, 1.5, 2];
      ratios.forEach((r, i) => note(root * r, i * 0.1, 0.35, 0.18));
    }
  } catch {}
};

// ====== NAVIGATION ======
function navigate(screen, data) {
  document.getElementById('app').innerHTML = '';
  if (screen === 'profiles')    { clearLevelTheme(); showProfileSelect(); }
  else if (screen === 'home')   { clearLevelTheme(); showHome(); }
  else if (screen === 'levels') { clearLevelTheme(); showLevelSelect(); }
  else if (screen === 'play')   showActivity(data);
  else if (screen === 'win')    showCelebration(data);
}

// ====== PROFILE SELECT ======
function showProfileSelect() {
  const app = document.getElementById('app');

  const cards = progress.profiles.map((p, i) => {
    const color = PROFILE_COLORS[i % PROFILE_COLORS.length];
    const avatar = AVATARS[i % AVATARS.length];
    const stars = Object.values(p.stars).reduce((s, v) => s + v, 0);
    return `
      <div class="level-card" data-idx="${i}">
        <div class="level-stripe" style="background:${color}"></div>
        <div class="level-emoji">${avatar}</div>
        <div class="level-name">${p.name || 'Player'}</div>
        <div class="level-bond">${stars} ⭐</div>
      </div>`;
  }).join('');

  app.innerHTML = `
    <div class="screen-levels">
      <h2 class="levels-title">Who's playing? 👋</h2>
      <div class="levels-grid" style="grid-template-columns:repeat(2,1fr);max-width:440px">
        ${cards}
        <div class="level-card" id="btn-add-profile">
          <div class="level-stripe" style="background:#34D399"></div>
          <div class="level-emoji">➕</div>
          <div class="level-name">New Player</div>
          <div class="level-bond">&nbsp;</div>
        </div>
      </div>
    </div>`;

  app.querySelectorAll('.level-card:not(#btn-add-profile)').forEach(card => {
    card.onclick = () => {
      progress.active = +card.dataset.idx;
      saveProgress();
      navigate('home');
    };
  });

  app.querySelector('#btn-add-profile').onclick = () => {
    progress.profiles.push({ name: '', unlocked: 1, stars: {} });
    progress.active = progress.profiles.length - 1;
    saveProgress();
    navigate('home');
  };
}

// ====== HOME ======
function showHome() {
  const app = document.getElementById('app');
  const profile = currentProfile();
  const hasName = profile.name && profile.name.length > 0;
  const multiProfile = progress.profiles.length > 1;

  app.innerHTML = `
    <div class="screen-home">
      <img src="assets/unicorn.svg" class="home-unicorn" alt="">
      <h1 class="home-title">✨ Sparkle Meadow ✨</h1>
      ${hasName
        ? `<p class="home-greeting">Hi, <strong>${profile.name}</strong>! 👋</p>
           <p class="home-stars">⭐ ${totalStars()} stars collected</p>
           <button class="btn btn-gold btn-play" id="btn-play">Play ▶</button>
           <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
             <button class="btn btn-ghost btn-sm" id="btn-switch">Switch Player</button>
             <button class="btn btn-ghost btn-sm" id="btn-reset">Reset Progress</button>
           </div>`
        : `<p class="home-sub">What's your name?</p>
           <input type="text" id="name-input" class="name-input"
                  placeholder="Type your name..." maxlength="20" autocomplete="off">
           <button class="btn btn-gold btn-play" id="btn-play">Let's go! ▶</button>
           ${multiProfile ? `<button class="btn btn-ghost btn-sm" id="btn-switch">← Back</button>` : ''}
          `
      }
    </div>`;

  if (hasName) {
    app.querySelector('#btn-play').onclick = () => navigate('levels');

    app.querySelector('#btn-switch').onclick = () => navigate('profiles');

    app.querySelector('#btn-reset').onclick = () => {
      if (confirm(`Delete all of ${profile.name}'s stars and start over?`)) {
        currentProfile().stars = {};
        currentProfile().unlocked = 1;
        saveProgress();
        showHome();
      }
    };
  } else {
    const input = app.querySelector('#name-input');
    const btn = app.querySelector('#btn-play');
    setTimeout(() => input.focus(), 50);

    btn.onclick = () => {
      const name = input.value.trim();
      if (!name.length) { input.focus(); return; }
      currentProfile().name = name;
      saveProgress();
      navigate('levels');
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });

    const backBtn = app.querySelector('#btn-switch');
    if (backBtn) backBtn.onclick = () => navigate('profiles');
  }
}

// ====== LEVEL SELECT ======
function showLevelSelect() {
  const app = document.getElementById('app');
  const profile = currentProfile();

  const cards = LEVELS.map(lv => {
    const locked = lv.id > profile.unlocked;
    const earned = levelStars(lv.id);
    const max = lv.activities.length * 3;
    const starsHtml = locked
      ? `<span class="level-lock">🔒</span>`
      : Array.from({length: max}, (_, i) => `<span>${i < earned ? '⭐' : '☆'}</span>`).join('');
    return `
      <div class="level-card ${locked ? 'locked' : ''}" data-id="${lv.id}">
        <div class="level-stripe" style="background:${lv.color}"></div>
        <div class="level-emoji">${lv.emoji}</div>
        <div class="level-name">${lv.name}</div>
        <div class="level-bond">${lv.bond}</div>
        <div class="level-stars">${starsHtml}</div>
      </div>`;
  }).join('');

  app.innerHTML = `
    <div class="screen-levels">
      <h2 class="levels-title">${profile.name ? `${profile.name}'s Levels` : 'Choose a Level'}</h2>
      <div class="levels-grid">${cards}</div>
      <button class="btn btn-ghost" id="btn-home">⬅ Home</button>
    </div>`;

  app.querySelector('#btn-home').onclick = () => navigate('home');
  app.querySelectorAll('.level-card:not(.locked)').forEach(card => {
    card.onclick = () => navigate('play', { levelId: +card.dataset.id, actIdx: 0 });
  });
}

// ====== ACTIVITY ======
function showActivity({ levelId, actIdx }) {
  const level = LEVELS.find(l => l.id === levelId);
  setLevelTheme(level);
  const act = level.activities[actIdx];
  const app = document.getElementById('app');

  const dots = level.activities.map((_, i) =>
    `<div class="act-dot ${i < actIdx ? 'done' : i === actIdx ? 'current' : ''}"></div>`
  ).join('');

  app.innerHTML = `
    <div class="screen-activity">
      <div class="act-header">
        <button class="btn btn-ghost" id="btn-map" style="font-size:.9rem;padding:10px 18px">⬅ Map</button>
        <span class="act-level-name">${level.emoji} ${level.name}</span>
        <div class="act-dots">${dots}</div>
      </div>
      <div class="act-main" id="act-main"></div>
      <div id="uni-corner">
        <div id="uni-bubble"></div>
        <img src="assets/unicorn.svg" id="uni-img" alt="Sparkle">
      </div>
    </div>`;

  app.querySelector('#btn-map').onclick = () => navigate('levels');

  function onComplete(stars) {
    const profile = currentProfile();
    const key = actKey(levelId, actIdx);
    if (!profile.stars[key] || stars > profile.stars[key]) profile.stars[key] = stars;

    const nextIdx = actIdx + 1;
    const hasNext = nextIdx < level.activities.length;

    if (!hasNext) {
      const allDone = level.activities.every((_, i) => profile.stars[actKey(levelId, i)]);
      if (allDone && levelId >= profile.unlocked) {
        profile.unlocked = Math.min(levelId + 1, LEVELS.length);
      }
    }
    saveProgress();
    navigate('win', { levelId, actIdx, stars, nextIdx: hasNext ? nextIdx : null });
  }

  const container = document.getElementById('act-main');
  if (act.type === 'fill-frame')       FillFrame.init(container, act, onComplete);
  else if (act.type === 'make-pair')   MakePair.init(container, act, onComplete);
  else if (act.type === 'match-bonds') MatchBonds.init(container, act, onComplete);
  else if (act.type === 'place-value') PlaceValue.init(container, act, onComplete);
}

// ====== CELEBRATION ======
function showCelebration({ levelId, actIdx, stars, nextIdx }) {
  const level = LEVELS.find(l => l.id === levelId);
  const profile = currentProfile();
  const levelDone = nextIdx === null &&
    level.activities.every((_, i) => profile.stars[actKey(levelId, i)]);

  const n = profile.name || 'you';
  const msgs = [
    `Keep going, ${n}! You finished it! 💪`,
    `Well done, ${n}! Keep it up! ⭐`,
    `${n}, you're a maths star! 🌟`,
  ];
  const msg = msgs[Math.min(stars - 1, 2)];

  const title = levelDone
    ? (profile.name ? `🎉 Amazing, ${profile.name}! 🎉` : '🎉 Level Complete! 🎉')
    : stars === 3 ? '🌟 Perfect! 🌟'
    : stars === 2 ? 'Well done!'
    : 'You finished it!';

  const animClass = `cel-anim-${stars}`;

  const starsHtml = [1,2,3].map(i =>
    `<span class="cel-star ${i > stars ? 'empty' : ''}">${i <= stars ? '⭐' : '☆'}</span>`
  ).join('');

  const nextBtn = nextIdx !== null
    ? `<button class="btn btn-purple" id="btn-next">Next Activity ▶</button>`
    : levelDone
      ? `<button class="btn btn-gold" id="btn-next">Next Level ▶</button>`
      : `<button class="btn btn-purple" id="btn-next">Play Again ▶</button>`;

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="confetti-layer" id="confetti"></div>
    <div class="screen-celebration ${animClass}">
      <h2 class="cel-title">${title}</h2>
      <p class="cel-sub">${msg}</p>
      <div class="cel-stars">${starsHtml}</div>
      <div class="cel-btns">
        ${nextBtn}
        <button class="btn btn-ghost" id="btn-map-cel">Back to Map</button>
      </div>
    </div>`;

  spawnConfetti(document.getElementById('confetti'), stars);
  window.lastStars = stars;
  playSound('celebrate', 'triangle');

  const nextLevel = LEVELS.find(l => l.id === levelId + 1);
  app.querySelector('#btn-next').onclick = () => {
    if (nextIdx !== null) navigate('play', { levelId, actIdx: nextIdx });
    else if (levelDone && nextLevel && nextLevel.id <= profile.unlocked)
      navigate('play', { levelId: nextLevel.id, actIdx: 0 });
    else navigate('play', { levelId, actIdx: 0 });
  };
  app.querySelector('#btn-map-cel').onclick = () => navigate('levels');
}

function spawnConfetti(container, stars) {
  const colors = ['#F472B6','#C084FC','#FCD34D','#34D399','#38BDF8','#F87171','#FB923C'];
  const count = stars === 3 ? 60 : stars === 2 ? 30 : 14;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const size = stars === 3 ? 10 + Math.random() * 16 : 7 + Math.random() * 10;
    el.className = 'cp';
    el.style.cssText = `
      left:${Math.random()*100}%;
      width:${size}px; height:${size}px;
      background:${colors[i % colors.length]};
      border-radius:${Math.random() > 0.5 ? '50%' : '3px'};
      animation-duration:${1.2 + Math.random()*2.2}s;
      animation-delay:${Math.random()*0.7}s;
      transform:rotate(${Math.random()*360}deg);
    `;
    container.appendChild(el);
  }
}

// ====== START ======
window.addEventListener('load', () => {
  // Show profile select if there are multiple profiles, otherwise go straight to home
  if (progress.profiles.length > 1) navigate('profiles');
  else navigate('home');
});
