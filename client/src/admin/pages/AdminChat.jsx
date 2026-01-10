import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext.jsx";
import axiosInstance from "../../api/axiosInstance.js";
import "./AdminChat.css";

const RAW = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_BASE = String(RAW).replace(/\/+$/, "").replace(/\/api\/?$/, "");

const str = (v) => (v == null ? "" : String(v));
const same = (a, b) => str(a) === str(b);

export default function AdminChat() {
  const { user, loading: authLoading } = useAuth();
  const adminId = useMemo(() => (user?._id ? String(user._id) : ""), [user?._id]);

  const [supportAdminId, setSupportAdminId] = useState("");
  const inboxId = useMemo(() => (supportAdminId ? String(supportAdminId) : adminId), [supportAdminId, adminId]);

  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null); 
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const activePartnerRef = useRef(null);

  useEffect(() => {
    activePartnerRef.current = active?.userId ? String(active.userId) : null;
  }, [active]);

  // 1) Отримання ID головного адміна підтримки
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/chat/support-admin`);
        const data = await res.json();
        if (alive) setSupportAdminId(String(data?.adminId || ""));
      } catch {
        if (alive) setSupportAdminId("");
      }
    })();
    return () => { alive = false; };
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/admin/chat-conversations");
      const list = Array.isArray(data) ? data : data?.conversations || [];
      setConversations(list);
    } catch (e) {
      setErr("Не вдалося завантажити список чатів");
    }
  }, []);

  const loadHistory = useCallback(async (partnerId) => {
    if (!inboxId || !partnerId) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/api/messages/${inboxId}/${partnerId}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr("Помилка завантаження історії");
    } finally {
      setLoadingHistory(false);
    }
  }, [inboxId]);

  // 2) Налаштування Socket.IO
  useEffect(() => {
    if (authLoading || !inboxId) return;

    const s = io(API_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = s;

    s.on("connect", () => {
      setConnected(true);
      s.emit("join_chat", inboxId);
    });

    s.on("disconnect", () => setConnected(false));

    s.on("receive_message", (msg) => {
      loadConversations(); // Оновити список зліва
      const partner = activePartnerRef.current;
      if (!partner) return;

      const isChat = (same(msg.sender, inboxId) && same(msg.receiver, partner)) ||
                     (same(msg.sender, partner) && same(msg.receiver, inboxId));

      if (isChat) {
        setMessages((prev) => {
          const id = msg._id ? String(msg._id) : "";
          if (id && prev.some((x) => String(x._id) === id)) return prev;
          return [...prev, msg];
        });
      }
    });

    loadConversations();
    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [inboxId, authLoading, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, active?.userId]);

  const selectConversation = async (conv) => {
    const partnerId = String(conv.userId);
    setActive(conv);
    setMessages([]);
    await loadHistory(partnerId);
    socketRef.current?.emit("mark_read", { myId: inboxId, partnerId });
    loadConversations();
  };

  const send = () => {
    const t = text.trim();
    if (!t || !active?.userId || !socketRef.current || !connected) return;

    socketRef.current.emit("send_message", {
      sender: inboxId,
      receiver: String(active.userId),
      text: t,
      isGuest: Boolean(active?.isGuest),
    });
    setText("");
  };

  return (
    <div className="admchat">
      <aside className="admchat-left">
        <div className="admchat-left-head">
          <div className="admchat-title">MebliHub Support</div>
          <button className="admchat-btn" onClick={loadConversations}>🔄</button>
        </div>
        <div className={`admchat-conn ${connected ? "online" : "offline"}`}>
          {connected ? "● Online" : "○ Offline"}
        </div>
        <div className="admchat-list">
          {conversations.map((c) => (
            <button
              key={String(c.userId)}
              className={`admchat-item ${same(active?.userId, c.userId) ? "active" : ""}`}
              onClick={() => selectConversation(c)}
            >
              <div className="admchat-item-top">
                <div className="admchat-name">{c.userName || "Гість"}</div>
                {c.unreadCount > 0 && <div className="admchat-badge">{c.unreadCount}</div>}
              </div>
              <div className="admchat-last">{c.lastMessage}</div>
              <div className="admchat-date">
                {c.lastDate ? new Date(c.lastDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="admchat-right">
        {!active ? (
          <div className="admchat-placeholder">
            <div className="admchat-placeholder-title">Виберіть діалог</div>
            <p>Натисніть на користувача зліва, щоб почати переписку</p>
          </div>
        ) : (
          <>
            <div className="admchat-right-head">
              <div className="admchat-peer">{active.userName}</div>
              <button className="admchat-btn ghost" onClick={() => setActive(null)}>Закрити</button>
            </div>
            <div className="admchat-msgs">
              {loadingHistory && <div className="admchat-loading">Завантаження...</div>}
              {messages.map((m, i) => {
                const mine = same(m.sender, inboxId);
                return (
                  <div key={m._id || i} className={`admchat-row ${mine ? "mine" : "theirs"}`}>
                    <div className="admchat-bubble">
                      <div className="admchat-text">{m.text}</div>
                      <div className="admchat-time">
                        {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="admchat-input">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Напишіть повідомлення..."
                disabled={!connected}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button className="admchat-send" onClick={send} disabled={!connected || !text.trim()}>Відправити</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}