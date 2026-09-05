const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export type User = { id: string; username: string };
export type Friend = { id: string; username: string; online: boolean };
export type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Đã xảy ra lỗi, vui lòng thử lại.");
  }
  return data as T;
}

export const api = {
  register: (username: string, password: string) =>
    request<{ token: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  login: (username: string, password: string) =>
    request<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  getFriends: (token: string) =>
    request<Friend[]>("/api/friends", { token }),
  addFriend: (token: string, username: string) =>
    request<Friend>("/api/friends", {
      method: "POST",
      token,
      body: JSON.stringify({ username }),
    }),
  getMessages: (token: string, friendId: string) =>
    request<Message[]>(`/api/messages/${friendId}`, { token }),
};

export { API_BASE };
