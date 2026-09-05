import { Router } from "express";
import { db } from "./db.js";
import { requireAuth } from "./middleware.js";

export function createFriendsRouter(onlineUserIds) {
  const router = Router();

  router.get("/", requireAuth, (req, res) => {
    const rows = db
      .prepare(
        `SELECT u.id, u.username
         FROM friendships f
         JOIN users u ON u.id = f.friend_id
         WHERE f.user_id = ?
         ORDER BY u.username COLLATE NOCASE`
      )
      .all(req.userId);

    const friends = rows.map((r) => ({
      id: r.id,
      username: r.username,
      online: onlineUserIds.has(r.id),
    }));
    res.json(friends);
  });

  router.post("/", requireAuth, (req, res) => {
    const { username } = req.body || {};
    if (typeof username !== "string" || !username.trim()) {
      return res.status(400).json({ error: "Username không được để trống." });
    }
    if (username === req.username) {
      return res.status(400).json({ error: "Không thể tự thêm chính mình." });
    }

    const friend = db
      .prepare("SELECT id, username FROM users WHERE username = ?")
      .get(username);
    if (!friend) {
      return res.status(404).json({ error: "Không tìm thấy username này." });
    }

    const now = new Date().toISOString();
    const insert = db.prepare(
      "INSERT OR IGNORE INTO friendships (user_id, friend_id, created_at) VALUES (?, ?, ?)"
    );
    const tx = db.transaction(() => {
      insert.run(req.userId, friend.id, now);
      insert.run(friend.id, req.userId, now);
    });
    tx();

    res.status(201).json({
      id: friend.id,
      username: friend.username,
      online: onlineUserIds.has(friend.id),
    });
  });

  return router;
}
