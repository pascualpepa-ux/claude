---
title: TDD — Messaging App (Username-only)
author: Tech Lead (Dispatcher)
created: 2026-09-05
---

# Technical Design Doc — Messaging App

## 1. Kiến trúc tổng quan
```
client/ (React + Vite + TypeScript)
   │  REST (auth, friends, history) + WebSocket (realtime message, presence)
   ▼
server/ (Node.js + Express + Socket.IO)
   │
   ▼
SQLite (better-sqlite3, file db.sqlite)
```

## 2. SQL Schema

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,           -- uuid
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE friendships (
  user_id TEXT NOT NULL REFERENCES users(id),
  friend_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, friend_id)
);
-- lưu 2 dòng đối xứng (A→B và B→A) khi thêm bạn, để query đơn giản 1 chiều

CREATE TABLE messages (
  id TEXT PRIMARY KEY,           -- uuid
  sender_id TEXT NOT NULL REFERENCES users(id),
  receiver_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_messages_pair ON messages(sender_id, receiver_id, created_at);
```

## 3. API Contract (REST)

| Method | Path | Body | Response | Auth |
|---|---|---|---|---|
| POST | /api/auth/register | `{username, password}` | `{token, user:{id,username}}` | không |
| POST | /api/auth/login | `{username, password}` | `{token, user:{id,username}}` | không |
| GET | /api/friends | — | `[{id, username, online}]` | JWT |
| POST | /api/friends | `{username}` | `{id, username, online}` | JWT |
| GET | /api/messages/:friendId | — | `[{id, senderId, receiverId, content, createdAt}]` | JWT |

JWT gửi qua header `Authorization: Bearer <token>`, thời hạn 7 ngày, secret từ env `JWT_SECRET`.

## 4. WebSocket events (Socket.IO)

| Event | Chiều | Payload |
|---|---|---|
| `connection` (auth qua `socket.handshake.auth.token`) | client→server | JWT token |
| `presence:update` | server→tất cả bạn bè liên quan | `{userId, online}` |
| `message:send` | client→server | `{receiverId, content}` |
| `message:new` | server→sender + receiver (nếu online) | `{id, senderId, receiverId, content, createdAt}` |

## 5. Sequence — gửi tin nhắn real-time
```
Client A --message:send--> Server
Server: lưu message vào SQLite (uuid, created_at)
Server --message:new--> Client A (ack, hiển thị ngay)
Server: kiểm tra receiver có socket đang connect không
  Có  --message:new--> Client B (hiển thị ngay, không cần reload)
  Không -> Client B sẽ thấy khi GET /api/messages/:friendId lúc mở lại chat
```

## 6. Bảo mật (mức MVP, không chạy security-audit-stride đầy đủ vì không đụng payment/PII nhạy cảm)
- Password hash bằng bcrypt (cost 10), không bao giờ trả password_hash ra API.
- JWT ký bằng secret từ biến môi trường, không hardcode.
- Validate input server-side (username regex `^[a-zA-Z0-9_]{3,20}$`, password ≥ 6 ký tự).
- Escape/parameterized query (better-sqlite3 dùng prepared statement mặc định) → chống SQL injection.
- CORS giới hạn origin của client trong dev.

## 7. Cấu trúc thư mục code
```
src/
├── server/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js
│       ├── db.js
│       ├── auth.js
│       ├── middleware.js
│       ├── friends.js
│       └── messages.js
└── client/
    ├── package.json
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api.ts
        ├── socket.ts
        ├── context/AuthContext.tsx
        └── pages/
            ├── Login.tsx
            ├── Register.tsx
            └── Chat.tsx
```
