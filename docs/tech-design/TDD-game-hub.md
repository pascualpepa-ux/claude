---
title: Technical Design — Game Hub
slug: game-hub
status: Approved
created: 2026-10-12
updated: 2026-10-12
owner: Tech Lead
---

# TDD — Game Hub

## 1. Kiến trúc tổng quan
Single Page App 100% client-side, không build step, không framework:

```
src/
├── index.html          # 1 trang duy nhất: Home view + 8 Game view (ẩn/hiện bằng CSS)
├── css/
│   └── style.css       # Dark theme, layout thẻ game, responsive, style riêng từng game
└── js/
    ├── main.js          # Router đơn giản: show/hide view, load/save high score chung,
    │                     #   đăng ký danh sách game (metadata: id, tên, icon, mô tả)
    └── games/
        ├── tictactoe.js
        ├── snake.js
        ├── game2048.js
        ├── memory.js
        ├── breakout.js
        ├── minesweeper.js
        ├── rps.js
        └── simon.js
```

## 2. Quy ước module game (Game Interface)
Mỗi file trong `js/games/*.js` export 1 object theo convention (dùng `window.GameHub.register(...)`
vì không dùng bundler/ES module để tránh vấn đề CORS khi mở file trực tiếp bằng `file://`):

```js
GameHub.register({
  id: 'snake',
  name: 'Snake',
  icon: '🐍',
  description: 'Điều khiển rắn ăn mồi, tránh đâm vào thân/tường.',
  mount(container) { /* render DOM + gắn event listener vào container, trả về cleanup fn */ return cleanupFn; },
});
```

- `mount(container)` được gọi khi user chọn game → render toàn bộ UI của game vào `container`.
- `mount` trả về 1 cleanup function — `main.js` PHẢI gọi cleanup khi rời game (dừng `setInterval`/`requestAnimationFrame`,
  gỡ event listener) để tránh leak khi quay lại Home rồi vào game khác (tránh bug "chạy ngầm" ở AC §5 PRD).
- High score: mỗi game tự đọc/ghi `localStorage` qua helper chung `GameHub.highscore.get(id)` / `.set(id, value)`,
  key namespace: `gamehub:highscore:<id>`.

## 3. Router (`main.js`)
- State: `currentGameId` (null = Home).
- `showHome()`: render lại list thẻ game (đọc high score mới nhất), ẩn `#game-view`, hiện `#home-view`.
- `playGame(id)`: ẩn Home, hiện `#game-view`, gọi `cleanup` của game trước (nếu có), gọi `mount()` của game mới,
  lưu cleanup function trả về.
- Nút "⬅ Về trang chủ" trong `#game-view` luôn gọi `showHome()` (và cleanup game hiện tại trước).

## 4. Không dùng build tool — lý do
PRD §3 yêu cầu chạy ngay không cần cài dependency. Dùng `<script>` tag thường (không `type="module"`)
để tránh lỗi CORS khi mở trực tiếp bằng double-click file (`file://`) trên một số browser. Thứ tự load:
`main.js` trước (định nghĩa `GameHub.register`), rồi từng file game (mỗi file tự gọi `register` khi load).

## 5. Responsive & theme
- CSS Grid cho lưới thẻ game ở Home (`auto-fill, minmax(220px, 1fr)`).
- Game canvas (Snake/Breakout) dùng kích thước tương đối, scale theo `clamp()`/`vmin` để vừa màn hình mobile.
- 1 bộ CSS variable màu (`--bg`, `--fg`, `--accent`, `--card-bg`) áp dụng chung + override nhỏ riêng từng game nếu cần.

## 6. Test / verify (không có CI/staging thật trong workspace này)
- Verify bằng `python3 -m http.server` tại `src/` + kiểm tra console log qua trình duyệt headless (Playwright) —
  xem `docs/test-cases/TC-game-hub.md`.

## 7. Non-functional
- Không gọi network nào (ngoại trừ load chính các file tĩnh) → không cần CSP đặc biệt, không rủi ro bảo mật
  liên quan dữ liệu nhạy cảm (đúng PRD §6, bỏ qua `security-audit-stride`).
