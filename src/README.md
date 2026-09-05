# Messaging App — Username-only

Ứng dụng nhắn tin real-time: đăng ký/đăng nhập chỉ bằng **username + password**,
không cần email. Xem chi tiết thiết kế tại `docs/prd/PRD-messaging-app-usernames.md`,
`docs/user-stories/US-messaging-app-usernames.md`, và
`docs/tech-design/TDD-messaging-app-usernames.md`.

## Cấu trúc

```
src/
├── server/   # Node.js + Express + Socket.IO + SQLite
└── client/   # React + Vite + TypeScript + Tailwind
```

## Chạy local

### 1. Server

```bash
cd src/server
npm install
cp .env.example .env   # rồi sửa JWT_SECRET thành chuỗi bí mật của bạn
npm run dev            # http://localhost:4000
```

### 2. Client (terminal khác)

```bash
cd src/client
npm install
npm run dev             # http://localhost:5173
```

Mở `http://localhost:5173` trên trình duyệt, bấm "Đăng ký", tạo username + password,
sau đó mời bạn bè cũng đăng ký rồi thêm nhau bằng username để bắt đầu chat.

## Test nhanh (đã verify khi build)

- REST API: register/login/friends/messages đã smoke-test bằng curl (đăng ký trùng
  username, sai mật khẩu, thêm bạn không tồn tại, tự thêm chính mình, đọc lịch sử khi
  chưa là bạn bè... đều trả lỗi đúng).
- Real-time: verify bằng socket.io-client script — gửi tin nhắn từ A, B nhận ngay lập
  tức qua sự kiện `message:new`, presence online/offline qua `presence:update`.
- End-to-end UI: verify bằng Playwright (Chromium) — đăng ký 2 tài khoản, thêm bạn hai
  chiều, gửi/nhận tin nhắn real-time qua giao diện thật, chụp screenshot xác nhận.

## Build production (client)

```bash
cd src/client
npm run build   # xuất ra src/client/dist/
```

Server chạy `node src/index.js` với các biến môi trường trong `.env` (xem `.env.example`).
