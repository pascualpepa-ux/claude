(function () {
  const SIZE = 9;
  const MINES = 10;

  function mount(container, ctx) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="msg-banner" id="mine-msg">Click để mở ô, click phải (hoặc giữ) để đặt cờ 🚩</div>
      <div class="cell-grid mine-grid" id="mine-grid"></div>
      <div class="controls-row">
        <span id="mine-timer">Thời gian: 0s</span>
        <button class="btn" id="mine-restart">Chơi lại</button>
      </div>
    `;
    container.appendChild(wrap);

    const gridEl = wrap.querySelector('#mine-grid');
    const msgEl = wrap.querySelector('#mine-msg');
    const timerEl = wrap.querySelector('#mine-timer');
    const restartBtn = wrap.querySelector('#mine-restart');

    let cells, over, won, seconds, timerHandle, started;

    function buildCells() {
      const flat = Array.from({ length: SIZE * SIZE }, (_, i) => ({
        i, mine: false, revealed: false, flagged: false, adjacent: 0,
      }));
      const mineIdx = new Set();
      while (mineIdx.size < MINES) mineIdx.add(Math.floor(Math.random() * flat.length));
      mineIdx.forEach((i) => { flat[i].mine = true; });

      const neighbors = (i) => {
        const r = Math.floor(i / SIZE), col = i % SIZE;
        const out = [];
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr, nc = col + dc;
            if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) out.push(nr * SIZE + nc);
          }
        }
        return out;
      };

      flat.forEach((cell) => {
        cell.adjacent = neighbors(cell.i).filter((n) => flat[n].mine).length;
        cell.neighbors = neighbors(cell.i);
      });
      return flat;
    }

    function reset() {
      cells = buildCells();
      over = false;
      won = false;
      seconds = 0;
      started = false;
      clearInterval(timerHandle);
      timerEl.textContent = 'Thời gian: 0s';
      msgEl.textContent = 'Click để mở ô, click phải (hoặc giữ) để đặt cờ 🚩';
      render();
    }

    function startTimerIfNeeded() {
      if (started) return;
      started = true;
      timerHandle = setInterval(() => {
        seconds += 1;
        timerEl.textContent = `Thời gian: ${seconds}s`;
      }, 1000);
    }

    function revealCell(i) {
      const cell = cells[i];
      if (cell.revealed || cell.flagged) return;
      cell.revealed = true;
      if (cell.adjacent === 0 && !cell.mine) {
        cell.neighbors.forEach((n) => revealCell(n));
      }
    }

    function checkWin() {
      return cells.filter((c) => !c.mine).every((c) => c.revealed);
    }

    function handleReveal(i) {
      if (over) return;
      startTimerIfNeeded();
      const cell = cells[i];
      if (cell.flagged) return;
      if (cell.mine) {
        cell.revealed = true;
        over = true;
        clearInterval(timerHandle);
        cells.forEach((c) => { if (c.mine) c.revealed = true; });
        msgEl.textContent = '💥 Nổ mìn! Bấm "Chơi lại" để thử lại.';
        render();
        return;
      }
      revealCell(i);
      if (checkWin()) {
        over = true;
        won = true;
        clearInterval(timerHandle);
        const score = Math.max(1000 - seconds * 5, 100);
        ctx.reportScore(score);
        msgEl.textContent = `🎉 Dò mìn thành công trong ${seconds}s! Điểm: ${score}`;
      }
      render();
    }

    function handleFlag(i, e) {
      e.preventDefault();
      if (over) return;
      startTimerIfNeeded();
      const cell = cells[i];
      if (cell.revealed) return;
      cell.flagged = !cell.flagged;
      render();
    }

    let pressTimer = null;
    function handlePressStart(i) {
      pressTimer = setTimeout(() => { handleFlag(i, { preventDefault() {} }); pressTimer = null; }, 450);
    }
    function handlePressEnd(i) {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
        handleReveal(i);
      }
    }

    function render() {
      gridEl.innerHTML = '';
      cells.forEach((cell) => {
        const el = document.createElement('div');
        el.className = 'mine-cell' + (cell.revealed ? ' revealed' : '') + (cell.revealed && cell.mine ? ' mine' : '');
        if (cell.revealed) {
          if (cell.mine) el.textContent = '💣';
          else if (cell.adjacent > 0) {
            el.textContent = String(cell.adjacent);
            el.style.color = ['', '#5aa7ff', '#3ecf8e', '#f1c40f', '#f05922'][Math.min(cell.adjacent, 4)] || '#fff';
          }
        } else if (cell.flagged) {
          el.textContent = '🚩';
          el.classList.add('flag');
        }
        el.addEventListener('click', () => handleReveal(cell.i));
        el.addEventListener('contextmenu', (e) => handleFlag(cell.i, e));
        gridEl.appendChild(el);
      });
    }

    restartBtn.addEventListener('click', reset);
    reset();

    return function cleanup() {
      clearInterval(timerHandle);
      restartBtn.removeEventListener('click', reset);
    };
  }

  window.GameHub.register({
    id: 'minesweeper',
    name: 'Minesweeper',
    icon: '💣',
    description: 'Mở hết các ô an toàn, tránh mìn. Click phải/giữ để đặt cờ.',
    mount,
  });
})();
