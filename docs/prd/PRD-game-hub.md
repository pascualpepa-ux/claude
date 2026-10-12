---
title: PRD — Game Hub (đa trò chơi)
slug: game-hub
status: Approved
created: 2026-10-12
updated: 2026-10-12
owner: Product Manager
---

# PRD — Game Hub

## 1. Mục tiêu
Xây dựng một web app "Game Hub" cho phép người dùng chơi nhiều trò chơi nhỏ (mini-games) ngay trong 1 ứng dụng, không cần cài đặt, không cần build tool, chạy được bằng cách mở file HTML hoặc qua static server.

## 2. Đối tượng người dùng
Người dùng cuối muốn giải trí nhanh với nhiều trò chơi cổ điển trong cùng 1 nơi, trên máy tính hoặc điện thoại (responsive).

## 3. Phạm vi (Goals)
- Trang chủ (Arcade Home) hiển thị danh sách thẻ game, mỗi thẻ có icon/tên/mô tả ngắn.
- Chọn 1 game → chuyển vào màn hình chơi full-screen trong app (SPA, không reload trang).
- Nút "⬅ Về trang chủ" luôn có trong màn hình chơi.
- Tối thiểu 8 trò chơi chơi được hoàn chỉnh (không placeholder):
  1. Tic-Tac-Toe (2 người chơi cùng máy)
  2. Snake (rắn săn mồi)
  3. 2048
  4. Memory Match (lật thẻ ghi nhớ)
  5. Breakout (phá gạch)
  6. Minesweeper (dò mìn)
  7. Rock-Paper-Scissors (Búa-Kéo-Giấy vs máy)
  8. Simon Says (ghi nhớ trình tự màu/âm)
- Lưu điểm cao nhất (high score) mỗi game vào `localStorage`, hiển thị trên thẻ game ở trang chủ.
- Responsive: chơi tốt trên màn hình desktop và mobile (viewport ≥ 360px).
- Dark theme nhất quán toàn app.
- Không cần tài khoản, không cần backend/server — 100% client-side.

## 4. Non-goals
- Không có multiplayer qua network.
- Không có hệ thống tài khoản/đăng nhập.
- Không có thanh toán / quảng cáo.
- Không yêu cầu build tool (Webpack/Vite) — HTML/CSS/JS thuần để chạy ngay không cần cài dependency.

## 5. Metric đo lường (định tính, vì không có backend analytics)
- Cả 8 game chơi được từ đầu đến khi thắng/thua/game-over mà không lỗi console.
- High score lưu và load lại đúng sau khi reload trang.
- Chuyển màn hình Home ↔ Game không bị kẹt state (ví dụ Snake vẫn chạy ngầm khi đã rời màn hình).

## 6. Rủi ro
- Không đụng auth/payment/DB schema/dữ liệu nhạy cảm → không cần security-audit-stride.
- Không có staging/production environment thật trong workspace này → bỏ qua bước DevOps deploy chính thức, chỉ cần verify chạy được bằng static server cục bộ.

## 7. Acceptance Criteria tổng quát
- [ ] Mở `src/index.html` (hoặc qua static server) → thấy trang chủ với 8 thẻ game.
- [ ] Click mỗi thẻ → vào đúng game, chơi được, có nút quay về Home.
- [ ] Mỗi game có high score hiển thị trên thẻ Home, cập nhật sau khi chơi.
- [ ] Không có lỗi JavaScript trong console khi chơi hết 1 lượt mỗi game.
