import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { v4 as uuid } from "uuid";

import { db } from "./db.js";
import { authRouter } from "./auth.js";
import { createFriendsRouter } from "./friends.js";
import { messagesRouter, areFriends } from "./messages.js";
import { verifySocketToken } from "./middleware.js";

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const MAX_MESSAGE_LENGTH = 4000;

const app = express();
// App chạy công khai trên Internet — tin tưởng header X-Forwarded-* từ đúng 1 reverse
// proxy phía trước (Render/Fly/nginx...) để rate-limit theo IP thật của client, không
// phải IP của proxy.
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: "16kb" }));

// Giới hạn chung cho toàn bộ API — chặn abuse/scrape thô sơ.
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Giới hạn chặt hơn cho đăng ký/đăng nhập — chống brute-force password và spam tạo
// tài khoản hàng loạt (app public, đăng ký mở cho bất kỳ ai).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Quá nhiều yêu cầu, vui lòng thử lại sau ít phút." },
});

// userId -> Set of socket ids (a user can have multiple tabs open)
const onlineUsers = new Map();
const onlineUserIds = {
  has: (id) => onlineUsers.has(id),
};

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/friends", createFriendsRouter(onlineUserIds));
app.use("/api/messages", messagesRouter);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN },
  // Chặn payload WebSocket bất thường lớn (mặc định 1MB) — tin nhắn text không cần vậy.
  maxHttpBufferSize: 64 * 1024,
});

function friendIdsOf(userId) {
  return db
    .prepare("SELECT friend_id AS friendId FROM friendships WHERE user_id = ?")
    .all(userId)
    .map((r) => r.friendId);
}

function broadcastPresence(userId, online) {
  for (const friendId of friendIdsOf(userId)) {
    const sockets = onlineUsers.get(friendId);
    if (!sockets) continue;
    for (const socketId of sockets) {
      io.to(socketId).emit("presence:update", { userId, online });
    }
  }
}

io.use((socket, next) => {
  try {
    const { token } = socket.handshake.auth || {};
    const payload = verifySocketToken(token);
    socket.userId = payload.sub;
    socket.username = payload.username;
    next();
  } catch {
    next(new Error("unauthorized"));
  }
});

io.on("connection", (socket) => {
  const { userId } = socket;

  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  const wasOffline = onlineUsers.get(userId).size === 0;
  onlineUsers.get(userId).add(socket.id);
  if (wasOffline) {
    broadcastPresence(userId, true);
  }

  socket.on("message:send", ({ receiverId, content }) => {
    if (typeof content !== "string" || !content.trim()) return;
    if (content.length > MAX_MESSAGE_LENGTH) return;
    if (typeof receiverId !== "string") return;
    if (!areFriends(userId, receiverId)) return;

    const message = {
      id: uuid(),
      senderId: userId,
      receiverId,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    db.prepare(
      "INSERT INTO messages (id, sender_id, receiver_id, content, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(message.id, message.senderId, message.receiverId, message.content, message.createdAt);

    // echo back to every socket of the sender (other open tabs) and receiver
    for (const socketId of onlineUsers.get(userId) || []) {
      io.to(socketId).emit("message:new", message);
    }
    for (const socketId of onlineUsers.get(receiverId) || []) {
      io.to(socketId).emit("message:new", message);
    }
  });

  socket.on("disconnect", () => {
    const sockets = onlineUsers.get(userId);
    if (!sockets) return;
    sockets.delete(socket.id);
    if (sockets.size === 0) {
      onlineUsers.delete(userId);
      broadcastPresence(userId, false);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Messaging server listening on http://localhost:${PORT}`);
});
