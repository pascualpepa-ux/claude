(function () {
  const GRID = 20;
  const CELL = 18;

  function mount(container, ctx) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="msg-banner" id="snake-msg">Dùng phím mũi tên / WASD để di chuyển</div>
      <canvas id="snake-canvas" width="${GRID * CELL}" height="${GRID * CELL}"></canvas>
      <div class="controls-row">
        <button class="btn" id="snake-restart">Bắt đầu lại</button>
      </div>
    `;
    container.appendChild(wrap);

    const canvas = wrap.querySelector('#snake-canvas');
    const msgEl = wrap.querySelector('#snake-msg');
    const restartBtn = wrap.querySelector('#snake-restart');
    const c = canvas.getContext('2d');

    let snake, dir, nextDir, food, score, alive, timer;

    function randomFood() {
      let pos;
      do {
        pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
      } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
      return pos;
    }

    function reset() {
      snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
      dir = { x: 1, y: 0 };
      nextDir = dir;
      score = 0;
      alive = true;
      food = randomFood();
      msgEl.textContent = 'Dùng phím mũi tên / WASD để di chuyển';
      ctx.reportScore(score);
      draw();
    }

    function draw() {
      c.fillStyle = '#000';
      c.fillRect(0, 0, canvas.width, canvas.height);
      c.fillStyle = '#f05922';
      c.fillRect(food.x * CELL, food.y * CELL, CELL - 1, CELL - 1);
      snake.forEach((seg, i) => {
        c.fillStyle = i === 0 ? '#3ecf8e' : '#2a9d6f';
        c.fillRect(seg.x * CELL, seg.y * CELL, CELL - 1, CELL - 1);
      });
    }

    function tick() {
      if (!alive) return;
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID ||
          snake.some((s) => s.x === head.x && s.y === head.y)) {
        alive = false;
        msgEl.textContent = `Game Over! Điểm: ${score} — bấm "Bắt đầu lại"`;
        return;
      }

      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score += 10;
        ctx.reportScore(score);
        food = randomFood();
      } else {
        snake.pop();
      }
      draw();
    }

    function onKey(e) {
      const map = {
        ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 },
      };
      const next = map[e.key];
      if (!next) return;
      e.preventDefault();
      if (next.x === -dir.x && next.y === -dir.y) return; // avoid instant reverse
      nextDir = next;
    }

    document.addEventListener('keydown', onKey);
    restartBtn.addEventListener('click', reset);
    reset();
    timer = setInterval(tick, 120);

    return function cleanup() {
      clearInterval(timer);
      document.removeEventListener('keydown', onKey);
      restartBtn.removeEventListener('click', reset);
    };
  }

  window.GameHub.register({
    id: 'snake',
    name: 'Snake',
    icon: '🐍',
    description: 'Điều khiển rắn ăn mồi, tránh đâm vào thân hoặc tường.',
    mount,
  });
})();
