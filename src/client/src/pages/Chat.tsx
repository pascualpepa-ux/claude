import { useEffect, useRef, useState, type FormEvent } from "react";
import { api, type Friend, type Message } from "../api";
import { getSocket } from "../socket";
import { useAuth } from "../context/AuthContext";

export default function Chat() {
  const { user, token, logout } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newFriendUsername, setNewFriendUsername] = useState("");
  const [friendError, setFriendError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedFriend = friends.find((f) => f.id === selectedFriendId) || null;

  useEffect(() => {
    if (!token) return;
    api.getFriends(token).then(setFriends).catch(() => {});
  }, [token]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function onPresence({ userId, online }: { userId: string; online: boolean }) {
      setFriends((prev) =>
        prev.map((f) => (f.id === userId ? { ...f, online } : f))
      );
    }

    function onNewMessage(message: Message) {
      setMessages((prev) => {
        const relevant =
          message.senderId === selectedFriendId ||
          message.receiverId === selectedFriendId;
        return relevant ? [...prev, message] : prev;
      });
    }

    socket.on("presence:update", onPresence);
    socket.on("message:new", onNewMessage);
    return () => {
      socket.off("presence:update", onPresence);
      socket.off("message:new", onNewMessage);
    };
  }, [selectedFriendId]);

  useEffect(() => {
    if (!token || !selectedFriendId) {
      setMessages([]);
      return;
    }
    api.getMessages(token, selectedFriendId).then(setMessages).catch(() => {});
  }, [token, selectedFriendId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function onAddFriend(e: FormEvent) {
    e.preventDefault();
    if (!token || !newFriendUsername.trim()) return;
    setFriendError(null);
    try {
      const friend = await api.addFriend(token, newFriendUsername.trim());
      setFriends((prev) =>
        prev.some((f) => f.id === friend.id) ? prev : [...prev, friend]
      );
      setNewFriendUsername("");
    } catch (err) {
      setFriendError(err instanceof Error ? err.message : "Không thể thêm bạn.");
    }
  }

  function onSendMessage(e: FormEvent) {
    e.preventDefault();
    const socket = getSocket();
    if (!socket || !selectedFriendId || !draft.trim()) return;
    socket.emit("message:send", { receiverId: selectedFriendId, content: draft.trim() });
    setDraft("");
  }

  return (
    <div className="h-screen flex bg-slate-100">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Đăng nhập với</p>
            <p className="font-semibold text-slate-800">@{user?.username}</p>
          </div>
          <button
            onClick={logout}
            className="text-sm text-slate-500 hover:text-red-600"
          >
            Đăng xuất
          </button>
        </div>

        <form onSubmit={onAddFriend} className="p-4 border-b border-slate-200 space-y-2">
          <label className="text-sm font-medium text-slate-700">Thêm bạn theo username</label>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={newFriendUsername}
              onChange={(e) => setNewFriendUsername(e.target.value)}
              placeholder="username"
            />
            <button className="rounded-lg bg-indigo-600 text-white px-3 text-sm font-medium hover:bg-indigo-700">
              Thêm
            </button>
          </div>
          {friendError && <p className="text-xs text-red-600">{friendError}</p>}
        </form>

        <div className="flex-1 overflow-y-auto">
          {friends.length === 0 && (
            <p className="p-4 text-sm text-slate-400">Chưa có bạn bè nào.</p>
          )}
          {friends.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFriendId(f.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 ${
                f.id === selectedFriendId ? "bg-indigo-50" : ""
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  f.online ? "bg-green-500" : "bg-slate-300"
                }`}
                title={f.online ? "Online" : "Offline"}
              />
              <span className="font-medium text-slate-800">@{f.username}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        {!selectedFriend ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Chọn một người bạn để bắt đầu trò chuyện
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  selectedFriend.online ? "bg-green-500" : "bg-slate-300"
                }`}
              />
              <h2 className="font-semibold text-slate-800">@{selectedFriend.username}</h2>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((m) => {
                const mine = m.senderId === user?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                        mine
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={onSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-2">
              <input
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Nhập tin nhắn..."
              />
              <button className="rounded-lg bg-indigo-600 text-white px-4 font-medium hover:bg-indigo-700">
                Gửi
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
