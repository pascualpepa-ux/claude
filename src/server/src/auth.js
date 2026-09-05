import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { db } from "./db.js";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET env var is required");
}

export const authRouter = Router();

function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

authRouter.post("/register", (req, res) => {
  const { username, password } = req.body || {};

  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    return res.status(400).json({
      error:
        "Username phải từ 3-20 ký tự, chỉ gồm chữ, số và dấu gạch dưới.",
    });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Mật khẩu phải có ít nhất 6 ký tự." });
  }

  const existing = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username);
  if (existing) {
    return res.status(409).json({ error: "Username đã tồn tại." });
  }

  const id = uuid();
  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare(
    "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)"
  ).run(id, username, passwordHash, new Date().toISOString());

  const user = { id, username };
  return res.status(201).json({ token: signToken(user), user });
});

authRouter.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Sai username hoặc mật khẩu." });
  }

  const row = db
    .prepare("SELECT id, username, password_hash FROM users WHERE username = ?")
    .get(username);

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: "Sai username hoặc mật khẩu." });
  }

  const user = { id: row.id, username: row.username };
  return res.json({ token: signToken(user), user });
});
