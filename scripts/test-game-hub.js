// Smoke test for the Game Hub SPA (src/): serves src/ over a plain http.Server and
// drives every game through Playwright/Chromium, asserting no JS errors and that
// high scores persist in localStorage across reload. Run: node scripts/test-game-hub.js
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('/opt/node22/lib/node_modules/playwright'));
}
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');
const PORT = 8731;

function findChromiumExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) return process.env.PLAYWRIGHT_CHROMIUM_PATH;
  const base = '/opt/pw-browsers';
  if (fs.existsSync(base)) {
    const dir = fs.readdirSync(base).find((d) => d.startsWith('chromium-') || d === 'chromium');
    if (dir) {
      const candidate = path.join(base, dir, 'chrome-linux', 'chrome');
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return undefined; // fall back to Playwright's own bundled browser resolution
}

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };

const server = http.createServer((req, res) => {
  let p = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(ROOT, decodeURIComponent(p));
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'text/plain' });
    res.end(data);
  });
});

(async () => {
  await new Promise((resolve) => server.listen(PORT, resolve));
  const execPath = findChromiumExecutable();
  const browser = await chromium.launch({
    ...(execPath ? { executablePath: execPath } : {}),
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const loc = msg.location()?.url || '';
    if (loc.includes('favicon')) return;
    errors.push(`console.error: ${msg.text()} [${loc}]`);
  });
  page.on('requestfailed', (req) => errors.push(`requestfailed: ${req.url()} (${req.failure()?.errorText})`));
  page.on('response', (res) => { if (res.status() >= 400 && !res.url().endsWith('/favicon.ico')) errors.push(`http ${res.status()}: ${res.url()}`); });

  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForSelector('.game-card');

  const cardCount = await page.locator('.game-card').count();
  console.log('Home cards found:', cardCount);

  const gameIds = ['tictactoe', 'snake', '2048', 'memory', 'breakout', 'minesweeper', 'rps', 'simon'];

  for (const id of gameIds) {
    await page.evaluate((gid) => window.GameHub.playGame(gid), id);
    await page.waitForTimeout(300);
    const title = await page.locator('#game-title').textContent();
    console.log(`Opened game "${id}" -> title: ${title.trim()}`);

    // basic interaction per game to exercise logic paths
    if (id === 'tictactoe') {
      await page.locator('.ttt-cell').first().click();
    } else if (id === 'snake') {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(400);
    } else if (id === '2048') {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(100);
    } else if (id === 'memory') {
      const cards = page.locator('.memory-card');
      await cards.nth(0).click();
      await cards.nth(1).click();
    } else if (id === 'breakout') {
      await page.waitForTimeout(500);
    } else if (id === 'minesweeper') {
      await page.locator('.mine-cell').nth(40).click();
    } else if (id === 'rps') {
      await page.locator('.rps-btn').first().click();
    } else if (id === 'simon') {
      await page.locator('#simon-start').click();
      await page.waitForTimeout(800);
    }

    await page.locator('#back-btn').click();
    await page.waitForTimeout(150);
    const homeVisible = await page.locator('#home-view').isHidden();
    if (homeVisible) throw new Error(`Home view not visible after leaving ${id}`);
  }

  // Explicit high-score persistence check (PRD AC: lưu + hiển thị + sống qua reload)
  await page.evaluate(() => window.GameHub.highscore.set('snake', 77));
  await page.evaluate(() => window.GameHub.showHome());
  const snakeCardText = await page.locator('.game-card', { hasText: 'Snake' }).textContent();
  if (!snakeCardText.includes('77')) throw new Error('High score 77 not reflected on Snake card after set()');
  console.log('High score shown on Home card after set(): OK ->', snakeCardText.replace(/\s+/g, ' ').trim());

  await page.reload();
  await page.waitForSelector('.game-card');
  const snakeCardAfterReload = await page.locator('.game-card', { hasText: 'Snake' }).textContent();
  if (!snakeCardAfterReload.includes('77')) throw new Error('High score 77 did not survive page reload (localStorage)');
  console.log('High score survives full page reload: OK');

  const highscores = await page.evaluate(() =>
    Object.keys(localStorage).reduce((acc, k) => { acc[k] = localStorage.getItem(k); return acc; }, {})
  );
  console.log('LocalStorage after session:', highscores);

  await browser.close();
  server.close();

  if (errors.length) {
    console.log('\n=== JS ERRORS DETECTED ===');
    errors.forEach((e) => console.log(e));
    process.exit(1);
  } else {
    console.log('\nNo JS errors detected across all 8 games. PASS.');
  }
})().catch((e) => {
  console.error('TEST SCRIPT FAILED:', e);
  server.close();
  process.exit(1);
});
