// Game Hub core: registry, router, high-score storage. No build step, no modules —
// loaded as a plain script so this still works when opened via file:// (CORS-safe).
(function () {
  const games = [];
  let currentGame = null;
  let currentCleanup = null;

  const el = (id) => document.getElementById(id);

  const highscore = {
    key(id) { return `gamehub:highscore:${id}`; },
    get(id) {
      const raw = localStorage.getItem(this.key(id));
      return raw === null ? 0 : Number(raw) || 0;
    },
    set(id, value) {
      const current = this.get(id);
      if (value > current) {
        localStorage.setItem(this.key(id), String(value));
      }
      return Math.max(current, value);
    },
  };

  function register(game) {
    if (!game || !game.id || typeof game.mount !== 'function') {
      console.error('GameHub.register: invalid game definition', game);
      return;
    }
    games.push(game);
  }

  function renderHome() {
    const grid = el('game-grid');
    grid.innerHTML = '';
    games.forEach((game) => {
      const best = highscore.get(game.id);
      const card = document.createElement('div');
      card.className = 'game-card';
      card.innerHTML = `
        <div class="icon">${game.icon}</div>
        <p class="name">${game.name}</p>
        <p class="desc">${game.description}</p>
        <p class="best">${best > 0 ? 'Điểm cao nhất: ' + best : 'Chưa có điểm'}</p>
      `;
      card.addEventListener('click', () => playGame(game.id));
      grid.appendChild(card);
    });
  }

  function showHome() {
    stopCurrentGame();
    el('home-view').hidden = false;
    el('game-view').hidden = true;
    renderHome();
  }

  function stopCurrentGame() {
    if (typeof currentCleanup === 'function') {
      try { currentCleanup(); } catch (e) { console.error('cleanup error', e); }
    }
    currentCleanup = null;
    currentGame = null;
    el('game-container').innerHTML = '';
  }

  function updateScoreBadge(id, value) {
    const best = highscore.set(id, value || 0);
    el('game-score').textContent = best > 0 ? `🏆 ${best}` : '';
  }

  function playGame(id) {
    const game = games.find((g) => g.id === id);
    if (!game) return;
    stopCurrentGame();
    currentGame = game;
    el('home-view').hidden = true;
    el('game-view').hidden = false;
    el('game-title').textContent = `${game.icon} ${game.name}`;
    updateScoreBadge(id, 0);
    const container = el('game-container');
    currentCleanup = game.mount(container, {
      reportScore: (value) => updateScoreBadge(id, value),
    });
  }

  function init() {
    el('back-btn').addEventListener('click', showHome);
    renderHome();
  }

  window.GameHub = {
    register,
    init,
    showHome,
    playGame,
    highscore,
  };
})();
