---
title: Test Cases — Game Hub
slug: game-hub
status: Passed
created: 2026-10-12
updated: 2026-10-12
owner: QA Engineer
---

# TC — Game Hub

## Môi trường test
- `python3 -m http.server` / `node http-server` tại `src/` (không cần framework/backend).
- Trình duyệt Chromium headless (Playwright, `/opt/pw-browsers/chromium-1194`) — tự động hóa, không phải manual click thủ công.
- Script: `scripts/test-game-hub.js` (Node + Playwright).

## Kết quả chạy thử (chạy thực tế, không phải giả định)

| TC | Mô tả | Kết quả |
|----|-------|---------|
| TC-01 | Trang chủ hiển thị đúng 8 thẻ game | ✅ PASS — `Home cards found: 8` |
| TC-02 | Mở từng game trong 8 game, tiêu đề hiển thị đúng icon + tên | ✅ PASS — cả 8 game mở đúng title |
| TC-03 | Thực hiện 1 thao tác chơi cơ bản mỗi game (click/phím/vuốt) không phát sinh lỗi JS | ✅ PASS — không có `pageerror`/`console.error` (đã loại trừ 404 favicon.ico vô hại) |
| TC-04 | Nút "⬅ Về trang chủ" luôn đưa về Home, không kẹt state game cũ | ✅ PASS — `home-view` hiện lại sau mỗi game, không throw lỗi |
| TC-05 | High score lưu vào `localStorage` và hiển thị trên thẻ Home ngay sau khi set | ✅ PASS — set Snake = 77 → thẻ hiển thị "Điểm cao nhất: 77" |
| TC-06 | High score sống sót qua reload trang (`page.reload()`) | ✅ PASS — sau reload vẫn hiển thị 77 |
| TC-07 | Chơi thực tế phát sinh điểm cho RPS (streak) và 2048 (ghép số) trong lúc test | ✅ PASS — `gamehub:highscore:rps=1`, `gamehub:highscore:2048=4` ghi nhận tự động |

## Ghi chú
- Không cần `security-audit-stride` — app không đụng auth/payment/DB schema/dữ liệu nhạy cảm (PRD §6).
- Không có bước DevOps deploy chính thức (staging/production) vì workspace chưa có infra thật cho dự án sản phẩm nào — verify dừng ở mức "chạy đúng qua static server", đúng tinh thần Non-goals của PRD.
- Script test được lưu tại `scripts/test-game-hub.js` để tái sử dụng khi sửa code sau này (regression).
