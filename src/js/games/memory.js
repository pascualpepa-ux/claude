(function () {
  const ICONS = ['🍎', '🍌', '🍇', '🍉', '🍒', '🍋', '🍓', '🍍'];

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function mount(container, ctx) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="msg-banner" id="mem-msg">Lật 2 thẻ giống nhau để ghi điểm. Ít lượt lật hơn = điểm cao hơn.</div>
      <div class="cell-grid memory-grid" id="mem-grid"></div>
      <div class="controls-row">
        <span id="mem-moves">Lượt lật: 0</span>
        <button class="btn" id="mem-restart">Chơi lại</button>
      </div>
    `;
    container.appendChild(wrap);

    const gridEl = wrap.querySelector('#mem-grid');
    const msgEl = wrap.querySelector('#mem-msg');
    const movesEl = wrap.querySelector('#mem-moves');
    const restartBtn = wrap.querySelector('#mem-restart');

    let cards, flipped, matched, moves, lock;

    function reset() {
      cards = shuffle([...ICONS, ...ICONS]);
      flipped = [];
      matched = new Set();
      moves = 0;
      lock = false;
      msgEl.textContent = 'Lật 2 thẻ giống nhau để ghi điểm. Ít lượt lật hơn = điểm cao hơn.';
      movesEl.textContent = 'Lượt lật: 0';
      render();
    }

    function render() {
      gridEl.innerHTML = '';
      cards.forEach((icon, i) => {
        const card = document.createElement('div');
        const isFlipped = flipped.includes(i) || matched.has(i);
        card.className = 'memory-card' + (isFlipped ? ' flipped' : '') + (matched.has(i) ? ' matched' : '');
        card.textContent = isFlipped ? icon : '❔';
        card.addEventListener('click', () => handleFlip(i));
        gridEl.appendChild(card);
      });
    }

    function handleFlip(i) {
      if (lock || flipped.includes(i) || matched.has(i)) return;
      flipped.push(i);
      render();
      if (flipped.length === 2) {
        moves += 1;
        movesEl.textContent = `Lượt lật: ${moves}`;
        lock = true;
        const [a, b] = flipped;
        if (cards[a] === cards[b]) {
          matched.add(a);
          matched.add(b);
          flipped = [];
          lock = false;
          render();
          if (matched.size === cards.length) {
            const score = Math.max(1000 - moves * 20, 50);
            ctx.reportScore(score);
            msgEl.textContent = `🎉 Hoàn thành trong ${moves} lượt! Điểm: ${score}`;
          }
        } else {
          setTimeout(() => {
            flipped = [];
            lock = false;
            render();
          }, 700);
        }
      }
    }

    restartBtn.addEventListener('click', reset);
    reset();

    return function cleanup() {
      restartBtn.removeEventListener('click', reset);
    };
  }

  window.GameHub.register({
    id: 'memory',
    name: 'Memory Match',
    icon: '🧠',
    description: 'Lật thẻ ghi nhớ, tìm đủ các cặp giống nhau với ít lượt lật nhất.',
    mount,
  });
})();
