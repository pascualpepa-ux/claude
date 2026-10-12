(function () {
  const WIDTH = 360;
  const HEIGHT = 420;
  const PADDLE_W = 70;
  const PADDLE_H = 10;
  const BALL_R = 6;
  const ROWS = 4;
  const COLS = 7;
  const BRICK_W = WIDTH / COLS;
  const BRICK_H = 18;

  function mount(container, ctx) {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="msg-banner" id="brk-msg">Kéo chuột/vuốt để di chuyển thanh đỡ, hoặc dùng mũi tên trái/phải</div>
      <canvas id="brk-canvas" width="${WIDTH}" height="${HEIGHT}"></canvas>
      <div class="controls-row">
        <button class="btn" id="brk-restart">Bắt đầu lại</button>
      </div>
    `;
    container.appendChild(wrap);

    const canvas = wrap.querySelector('#brk-canvas');
    const msgEl = wrap.querySelector('#brk-msg');
    const restartBtn = wrap.querySelector('#brk-restart');
    const c = canvas.getContext('2d');

    let paddleX, ball, bricks, score, lives, running, rafId, keys;

    function buildBricks() {
      const b = [];
      for (let r = 0; r < ROWS; r++) {
        for (let col = 0; col < COLS; col++) {
          b.push({ x: col * BRICK_W, y: r * BRICK_H + 30, alive: true, color: ['#f05922', '#f1c40f', '#3ecf8e', '#5aa7ff'][r % 4] });
        }
      }
      return b;
    }

    function reset() {
      paddleX = WIDTH / 2 - PADDLE_W / 2;
      ball = { x: WIDTH / 2, y: HEIGHT - 40, vx: 2.4, vy: -3 };
      bricks = buildBricks();
      score = 0;
      lives = 3;
      running = true;
      keys = {};
      msgEl.textContent = 'Kéo chuột/vuốt để di chuyển thanh đỡ, hoặc dùng mũi tên trái/phải';
      ctx.reportScore(score);
      draw();
    }

    function draw() {
      c.fillStyle = '#000';
      c.fillRect(0, 0, WIDTH, HEIGHT);

      bricks.forEach((br) => {
        if (!br.alive) return;
        c.fillStyle = br.color;
        c.fillRect(br.x + 2, br.y, BRICK_W - 4, BRICK_H - 4);
      });

      c.fillStyle = '#e8ebf5';
      c.fillRect(paddleX, HEIGHT - 16, PADDLE_W, PADDLE_H);

      c.beginPath();
      c.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      c.fillStyle = '#f05922';
      c.fill();

      c.fillStyle = '#9aa3bd';
      c.font = '12px sans-serif';
      c.fillText(`Điểm: ${score}   Mạng: ${lives}`, 8, 16);
    }

    function tick() {
      if (!running) return;

      if (keys.ArrowLeft) paddleX -= 5;
      if (keys.ArrowRight) paddleX += 5;
      paddleX = Math.max(0, Math.min(WIDTH - PADDLE_W, paddleX));

      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x <= BALL_R || ball.x >= WIDTH - BALL_R) ball.vx *= -1;
      if (ball.y <= BALL_R) ball.vy *= -1;

      if (ball.y >= HEIGHT - 16 - BALL_R && ball.y <= HEIGHT - 6 &&
          ball.x >= paddleX && ball.x <= paddleX + PADDLE_W && ball.vy > 0) {
        ball.vy *= -1;
        const hitPos = (ball.x - (paddleX + PADDLE_W / 2)) / (PADDLE_W / 2);
        ball.vx = hitPos * 4;
      }

      if (ball.y > HEIGHT) {
        lives -= 1;
        if (lives <= 0) {
          running = false;
          msgEl.textContent = `Game Over! Điểm: ${score} — bấm "Bắt đầu lại"`;
        } else {
          ball = { x: WIDTH / 2, y: HEIGHT - 40, vx: 2.4, vy: -3 };
        }
      }

      bricks.forEach((br) => {
        if (!br.alive) return;
        if (ball.x > br.x && ball.x < br.x + BRICK_W && ball.y > br.y && ball.y < br.y + BRICK_H) {
          br.alive = false;
          ball.vy *= -1;
          score += 10;
          ctx.reportScore(score);
        }
      });

      if (bricks.every((br) => !br.alive)) {
        running = false;
        msgEl.textContent = `🎉 Phá hết gạch! Điểm: ${score}`;
      }

      draw();
      rafId = requestAnimationFrame(tick);
    }

    function onKeyDown(e) { keys[e.key] = true; }
    function onKeyUp(e) { keys[e.key] = false; }

    function moveToClientX(clientX) {
      const rect = canvas.getBoundingClientRect();
      const scale = WIDTH / rect.width;
      paddleX = (clientX - rect.left) * scale - PADDLE_W / 2;
      paddleX = Math.max(0, Math.min(WIDTH - PADDLE_W, paddleX));
    }
    function onMouseMove(e) { moveToClientX(e.clientX); }
    function onTouchMove(e) { if (e.touches[0]) moveToClientX(e.touches[0].clientX); e.preventDefault(); }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    restartBtn.addEventListener('click', reset);

    reset();
    rafId = requestAnimationFrame(tick);

    return function cleanup() {
      running = false;
      cancelAnimationFrame(rafId);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchmove', onTouchMove);
      restartBtn.removeEventListener('click', reset);
    };
  }

  window.GameHub.register({
    id: 'breakout',
    name: 'Breakout',
    icon: '🧱',
    description: 'Dùng thanh đỡ bật bóng phá hết gạch, đừng để bóng rơi xuống.',
    mount,
  });
})();
