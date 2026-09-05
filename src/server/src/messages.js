import { Router } from "express";
import { db } from "./db.js";
import { requireAuth } from "./middleware.js";

function areFriends(userId, otherId) {
  const row = db
    .prepare(
      "SELECT 1 FROM friendships WHERE user_id = ? AND friend_id = ?"
    )
    .get(userId, otherId);
  return Boolean(row);
}

export const messagesRouter = Router();

messagesRouter.get("/:friendId", requireAuth, (req, res) => {
  const { friendId } = req.params;

  if (!areFriends(req.userId, friendId)) {
    return res.status(403).json({ error: "Hai người chưa là bạn bè." });
  }

  const rows = db
    .prepare(
      `SELECT id, sender_id AS senderId, receiver_id AS receiverId, content, created_at AS createdAt
       FROM messages
       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
       ORDER BY created_at ASC`
    )
    .all(req.userId, friendId, friendId, req.userId);

  res.json(rows);
});

export { areFriends };
