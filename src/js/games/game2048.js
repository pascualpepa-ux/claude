(function () {
  const SIZE = 4;

  function mount(container, ctx) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="msg-banner" id="g2048-msg">Dùng phím mũi tên để ghép số</div>
      <div class="cell-grid g2048-grid" id="g2048-grid"></div>
      <div class="controls-row">
        <button class="btn" id="g2048-restart">Bắt đầu lại</button>
      </div>
    `;
    container.appendChild(wrap);

    const gridEl = wrap.querySelector('#g2048-grid');
    const msgEl = wrap.querySelector('#g2048-msg');
    const restartBtn = wrap.querySelector('#g2048-restart');

    let board, score, over;

    const colors = {
      0: '#1e2538', 2: '#3a3570', 4: '#4d4690', 8: '#f05922', 16: '#ff7a45',
      32: '#ff9a6b', 64: '#ffb98c', 128: '#f1c40f', 256: '#f5d547', 512: '#f8e46a',
      1024: '#3ecf8e', 2048: '#2ecc71',
    };

    function emptyBoard() {
      return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    }

    function addRandomTile() {
      const empties = [];
      for (let r = 0; r < SIZE; r++) for (let col = 0; col < SIZE; col++) if (board[r][col] === 0) empties.push([r, col]);
      if (empties.length === 0) return;
      const [r, col] = empties[Math.floor(Math.random() * empties.length)];
      board[r][col] = Math.random() < 0.9 ? 2 : 4;
    }

    function reset() {
      board = emptyBoard();
      score = 0;
      over = false;
      addRandomTile();
      addRandomTile();
      msgEl.textContent = 'Dùng phím mũi tên để ghép số';
      ctx.reportScore(score);
      render();
    }

    function render() {
      gridEl.innerHTML = '';
      for (let r = 0; r < SIZE; r++) {
        for (let col = 0; col < SIZE; col++) {
          const v = board[r][col];
          const cell = document.createElement('div');
          cell.className = 'g2048-cell';
          cell.style.background = colors[v] || '#2ecc71';
          cell.style.color = v <= 4 ? '#e8ebf5' : '#0b0f1a';
          cell.textContent = v || '';
          gridEl.appendChild(cell);
        }
      }
    }

    function slideAndMerge(line) {
      const filtered = line.filter((v) => v !== 0);
      const result = [];
      let gained = 0;
      for (let i = 0; i < filtered.length; i++) {
        if (filtered[i] === filtered[i + 1]) {
          const merged = filtered[i] * 2;
          result.push(merged);
          gained += merged;
          i++;
        } else {
          result.push(filtered[i]);
        }
      }
      while (result.length < SIZE) result.push(0);
      return { result, gained };
    }

    function move(dir) {
      if (over) return;
      let moved = false;
      let totalGain = 0;

      function getLine(i, reverse) {
        const line = [];
        for (let j = 0; j < SIZE; j++) {
          line.push(dir === 'left' || dir === 'right' ? board[i][j] : board[j][i]);
        }
        return reverse ? line.reverse() : line;
      }
      function setLine(i, line, reverse) {
        const finalLine = reverse ? [...line].reverse() : line;
        for (let j = 0; j < SIZE; j++) {
          if (dir === 'left' || dir === 'right') {
            if (board[i][j] !== finalLine[j]) moved = true;
            board[i][j] = finalLine[j];
          } else {
            if (board[j][i] !== finalLine[j]) moved = true;
            board[j][i] = finalLine[j];
          }
        }
      }

      const reverse = dir === 'right' || dir === 'down';
      for (let i = 0; i < SIZE; i++) {
        const line = getLine(i, reverse);
        const { result, gained } = slideAndMerge(line);
        totalGain += gained;
        setLine(i, result, reverse);
      }

      if (moved) {
        score += totalGain;
        ctx.reportScore(score);
        addRandomTile();
        render();
        checkGameOver();
      }
    }

    function checkGameOver() {
      for (let r = 0; r < SIZE; r++) {
        for (let col = 0; col < SIZE; col++) {
          if (board[r][col] === 0) return;
          if (col < SIZE - 1 && board[r][col] === board[r][col + 1]) return;
          if (r < SIZE - 1 && board[r][col] === board[r + 1][col]) return;
          if (board[r][col] >= 2048) { msgEl.textContent = '🎉 Bạn đạt 2048!'; }
        }
      }
      over = true;
      msgEl.textContent = `Hết đường đi! Điểm: ${score} — bấm "Bắt đầu lại"`;
    }

    function onKey(e) {
      const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
      const dir = map[e.key];
      if (!dir) return;
      e.preventDefault();
      move(dir);
    }

    let touchStart = null;
    function onTouchStart(e) { touchStart = e.touches[0]; }
    function onTouchEnd(e) {
      if (!touchStart) return;
      const dx = e.changedTouches[0].clientX - touchStart.clientX;
      const dy = e.changedTouches[0].clientY - touchStart.clientY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
      else move(dy > 0 ? 'down' : 'up');
      touchStart = null;
    }

    document.addEventListener('keydown', onKey);
    gridEl.addEventListener('touchstart', onTouchStart);
    gridEl.addEventListener('touchend', onTouchEnd);
    restartBtn.addEventListener('click', reset);
    reset();

    return function cleanup() {
      document.removeEventListener('keydown', onKey);
      gridEl.removeEventListener('touchstart', onTouchStart);
      gridEl.removeEventListener('touchend', onTouchEnd);
      restartBtn.removeEventListener('click', reset);
    };
  }

  window.GameHub.register({
    id: '2048',
    name: '2048',
    icon: '🔢',
    description: 'Gộp các ô số giống nhau để đạt 2048.',
    mount,
  });
})();
