---
step: 4
agent: senior-developer
status: done
completed_at: "2026-09-05 17:30"
---

## Đã làm
Implement backend tại `src/server/` theo đúng TDD: `db.js` (SQLite schema),
`auth.js` (register/login, bcrypt + JWT), `middleware.js` (requireAuth REST +
verifySocketToken WS), `friends.js` (thêm bạn 2 chiều, list kèm trạng thái
online), `messages.js` (lịch sử tin nhắn, chỉ cho phép giữa bạn bè),
`index.js` (Express + Socket.IO, presence tracking qua Map userId→Set socket,
event `message:send`/`message:new`/`presence:update`).

Đã smoke-test bằng curl + script socket.io-client thực tế (không phải chỉ đọc
code): đăng ký/đăng nhập đúng-sai, trùng username, thêm bạn không tồn tại/tự
thêm mình, đọc lịch sử khi chưa là bạn (403), không token (401), gửi tin nhắn
real-time 2 phía nhận được `message:new`, presence `online:true/false` khi
connect/disconnect — tất cả PASS.

## Artifact
- `src/server/package.json`, `.env.example`, `src/db.js`, `src/auth.js`,
  `src/middleware.js`, `src/friends.js`, `src/messages.js`, `src/index.js`

## Handoff Payload — bước sau đọc phần này
- do_not_redo: Backend đã verify hoạt động đúng qua curl + socket script — Frontend không cần viết lại logic auth/friends/message, chỉ cần gọi đúng API/socket event theo TDD mục 3-4.
- watch_out: JWT_SECRET là bắt buộc (server throw lỗi nếu thiếu) — khi chạy local phải copy `.env.example` → `.env` và điền giá trị trước khi start.
- next_inputs: API base mặc định `http://localhost:4000` (đổi qua `VITE_API_BASE`), socket auth qua `{auth: {token}}` khi connect — dùng đúng 2 điểm này khi viết `client/src/api.ts` và `client/src/socket.ts`.
