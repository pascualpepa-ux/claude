(function () {
  const COLORS = ['green', 'red', 'yellow', 'blue'];

  function mount(container, ctx) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="msg-banner" id="simon-msg">Bấm "Bắt đầu" rồi nhớ và lặp lại trình tự màu</div>
      <div class="cell-grid simon-grid" id="simon-grid">
        <div class="simon-pad green" data-color="green"></div>
        <div class="simon-pad red" data-color="red"></div>
        <div class="simon-pad yellow" data-color="yellow"></div>
        <div class="simon-pad blue" data-color="blue"></div>
      </div>
      <div class="controls-row">
        <span id="simon-level">Vòng: 0</span>
        <button class="btn" id="simon-start">Bắt đầu</button>
      </div>
    `;
    container.appendChild(wrap);

    const padsEl = wrap.querySelectorAll('.simon-pad');
    const msgEl = wrap.querySelector('#simon-msg');
    const levelEl = wrap.querySelector('#simon-level');
    const startBtn = wrap.querySelector('#simon-start');

    let sequence, playerStep, accepting, playTimeouts;

    function reset() {
      sequence = [];
      playerStep = 0;
      accepting = false;
      playTimeouts = [];
      levelEl.textContent = 'Vòng: 0';
      msgEl.textContent = 'Bấm "Bắt đầu" rồi nhớ và lặp lại trình tự màu';
    }

    function litPad(color, duration) {
      return new Promise((resolve) => {
        const pad = wrap.querySelector(`.simon-pad[data-color="${color}"]`);
        pad.classList.add('lit');
        const t1 = setTimeout(() => {
          pad.classList.remove('lit');
          const t2 = setTimeout(resolve, 150);
          playTimeouts.push(t2);
        }, duration);
        playTimeouts.push(t1);
      });
    }

    async function playSequence() {
      accepting = false;
      msgEl.textContent = 'Xem kỹ...';
      for (const color of sequence) {
        await litPad(color, 500);
      }
      accepting = true;
      playerStep = 0;
      msgEl.textContent = 'Đến lượt bạn — lặp lại trình tự';
    }

    function nextRound() {
      sequence.push(COLORS[Math.floor(Math.random() * COLORS.length)]);
      levelEl.textContent = `Vòng: ${sequence.length}`;
      playSequence();
    }

    function handlePad(color) {
      if (!accepting) return;
      const pad = wrap.querySelector(`.simon-pad[data-color="${color}"]`);
      pad.classList.add('lit');
      setTimeout(() => pad.classList.remove('lit'), 200);

      if (color === sequence[playerStep]) {
        playerStep += 1;
        if (playerStep === sequence.length) {
          ctx.reportScore(sequence.length - 1);
          setTimeout(nextRound, 600);
        }
      } else {
        accepting = false;
        ctx.reportScore(sequence.length - 1);
        msgEl.textContent = `Sai rồi! Bạn đạt vòng ${sequence.length - 1}. Bấm "Bắt đầu" để chơi lại.`;
        sequence = [];
        levelEl.textContent = 'Vòng: 0';
      }
    }

    function onPadClick(e) { handlePad(e.currentTarget.dataset.color); }
    function onStart() {
      playTimeouts.forEach(clearTimeout);
      reset();
      nextRound();
    }

    padsEl.forEach((p) => p.addEventListener('click', onPadClick));
    startBtn.addEventListener('click', onStart);
    reset();

    return function cleanup() {
      playTimeouts.forEach(clearTimeout);
      padsEl.forEach((p) => p.removeEventListener('click', onPadClick));
      startBtn.removeEventListener('click', onStart);
    };
  }

  window.GameHub.register({
    id: 'simon',
    name: 'Simon Says',
    icon: '🟢🔴',
    description: 'Ghi nhớ và lặp lại trình tự màu ngày càng dài.',
    mount,
  });
})();
