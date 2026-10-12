(function () {
  const CHOICES = { rock: '✊', paper: '✋', scissors: '✌️' };
  const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

  function mount(container, ctx) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="msg-banner" id="rps-msg">Chọn một trong 3: Búa / Giấy / Kéo</div>
      <div class="rps-choices">
        <button class="rps-btn" data-choice="rock">✊</button>
        <button class="rps-btn" data-choice="paper">✋</button>
        <button class="rps-btn" data-choice="scissors">✌️</button>
      </div>
      <div class="rps-result" id="rps-result"></div>
      <div class="controls-row">
        <span id="rps-score">Thắng 0 — Thua 0 — Hòa 0</span>
      </div>
    `;
    container.appendChild(wrap);

    const resultEl = wrap.querySelector('#rps-result');
    const scoreEl = wrap.querySelector('#rps-score');
    const msgEl = wrap.querySelector('#rps-msg');
    const buttons = wrap.querySelectorAll('.rps-btn');

    let wins = 0, losses = 0, draws = 0, streak = 0, bestStreak = 0;

    function play(choice) {
      const options = Object.keys(CHOICES);
      const cpu = options[Math.floor(Math.random() * options.length)];
      let outcome;
      if (choice === cpu) outcome = 'draw';
      else if (BEATS[choice] === cpu) outcome = 'win';
      else outcome = 'lose';

      if (outcome === 'win') { wins++; streak++; bestStreak = Math.max(bestStreak, streak); }
      else if (outcome === 'lose') { losses++; streak = 0; }
      else { draws++; }

      resultEl.textContent = `Bạn: ${CHOICES[choice]}  —  Máy: ${CHOICES[cpu]}  →  ` +
        (outcome === 'win' ? '🎉 Bạn thắng!' : outcome === 'lose' ? '😵 Bạn thua!' : '🤝 Hòa!');
      scoreEl.textContent = `Thắng ${wins} — Thua ${losses} — Hòa ${draws}`;
      msgEl.textContent = `Streak hiện tại: ${streak} (tốt nhất: ${bestStreak})`;
      ctx.reportScore(bestStreak);
    }

    function onClick(e) { play(e.currentTarget.dataset.choice); }
    buttons.forEach((b) => b.addEventListener('click', onClick));

    return function cleanup() {
      buttons.forEach((b) => b.removeEventListener('click', onClick));
    };
  }

  window.GameHub.register({
    id: 'rps',
    name: 'Búa - Kéo - Giấy',
    icon: '✊✋✌️',
    description: 'Đấu với máy, điểm cao nhất tính theo chuỗi thắng liên tiếp dài nhất.',
    mount,
  });
})();
