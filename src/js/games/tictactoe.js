(function () {
  function checkWinner(board) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    if (board.every((v) => v)) return 'draw';
    return null;
  }

  function mount(container) {
    let board = Array(9).fill(null);
    let turn = 'X';
    let wins = { X: 0, O: 0 };
    let over = false;

    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="msg-banner" id="ttt-msg">Lượt của X</div>
      <div class="cell-grid ttt-board" id="ttt-board"></div>
      <div class="controls-row">
        <span>Thắng: X ${0} — O ${0}</span>
        <button class="btn" id="ttt-reset">Chơi lại</button>
      </div>
    `;
    container.appendChild(wrap);

    const boardEl = wrap.querySelector('#ttt-board');
    const msgEl = wrap.querySelector('#ttt-msg');
    const scoreEl = wrap.querySelector('.controls-row span');
    const resetBtn = wrap.querySelector('#ttt-reset');

    function renderScore() {
      scoreEl.textContent = `Thắng: X ${wins.X} — O ${wins.O}`;
    }

    function render() {
      boardEl.innerHTML = '';
      board.forEach((val, i) => {
        const cell = document.createElement('div');
        cell.className = 'ttt-cell' + (val === 'X' ? ' x' : val === 'O' ? ' o' : '');
        cell.textContent = val || '';
        cell.addEventListener('click', () => handleClick(i));
        boardEl.appendChild(cell);
      });
    }

    function handleClick(i) {
      if (over || board[i]) return;
      board[i] = turn;
      const result = checkWinner(board);
      if (result === 'draw') {
        msgEl.textContent = 'Hòa!';
        over = true;
      } else if (result) {
        wins[result] += 1;
        renderScore();
        msgEl.textContent = `${result} thắng!`;
        over = true;
      } else {
        turn = turn === 'X' ? 'O' : 'X';
        msgEl.textContent = `Lượt của ${turn}`;
      }
      render();
    }

    function reset() {
      board = Array(9).fill(null);
      turn = 'X';
      over = false;
      msgEl.textContent = 'Lượt của X';
      render();
    }

    resetBtn.addEventListener('click', reset);
    render();
    renderScore();

    return function cleanup() {
      resetBtn.removeEventListener('click', reset);
    };
  }

  window.GameHub.register({
    id: 'tictactoe',
    name: 'Tic-Tac-Toe',
    icon: '❌⭕',
    description: '2 người chơi luân phiên trên cùng máy. Không có high score (trò chơi so điểm trực tiếp).',
    mount,
  });
})();
