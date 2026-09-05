---
step: 3
agent: tech-lead
status: done
completed_at: "2026-09-05 17:10"
---

## Đã làm
Viết TDD tại `docs/tech-design/TDD-messaging-app-usernames.md`: kiến trúc
client (React/Vite/TS) ↔ server (Node/Express/Socket.IO) ↔ SQLite, SQL schema
(`users`, `friendships` 2 chiều, `messages`), API contract REST 5 endpoint,
WebSocket events (`message:send`/`message:new`/`presence:update`), sequence
diagram gửi tin nhắn, quyết định bảo mật (bcrypt, JWT, prepared statement,
validate input) — không chạy security-audit-stride đầy đủ vì MVP không đụng
payment/PII nhạy cảm, chỉ auth cơ bản.

## Artifact
- `docs/tech-design/TDD-messaging-app-usernames.md`

## Handoff Payload — bước sau đọc phần này
- do_not_redo: Schema và API contract đã chốt — Developer không cần tự thiết kế lại, implement đúng theo TDD.
- watch_out: `friendships` phải insert đối xứng (A→B và B→A) trong 1 transaction khi thêm bạn — nếu chỉ insert 1 chiều, receiver sẽ không thấy sender trong danh sách bạn bè.
- next_inputs: Đọc mục 2 (schema), 3 (REST contract), 4 (socket events), 5 (sequence) của TDD để code server; đọc mục 7 (cấu trúc thư mục) để đặt file đúng vị trí.
