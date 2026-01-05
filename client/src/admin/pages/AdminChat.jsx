// client/src/admin/pages/AdminChat.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import { adminApi } from "../api/adminApi.js";
import { endpoints } from "../api/endpoints.js";
import { useToast } from "../components/Toast.jsx";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ADMIN_ID = import.meta.env.VITE_ADMIN_ID || "";

export default function AdminChat() {
  const toast = useToast();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const listRef = useRef(null);
  const socketRef = useRef(null);

  const adminId = useMemo(() => ADMIN_ID, []);

  const loadConversations = async () => {
    try {
      const r = await adminApi.get(endpoints.chatConversations);
      setConversations(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      toast.error(e.friendlyMessage || "Failed to load conversations");
    }
  };

  const loadMessages = async (partnerId) => {
    try {
      if (!adminId) {
        toast.error("VITE_ADMIN_ID is not set in client/.env");
        return;
      }
      const r = await adminApi.get(endpoints.messagesBetween(adminId, partnerId));
      setMessages(Array.isArray(r.data) ? r.data : []);
      // scroll
      setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 50);
    } catch (e) {
      toast.error(e.friendlyMessage || "Failed to load messages");
    }
  };

  useEffect(() => {
    loadConversations();

    // init socket
    socketRef.current = io(API_URL, { withCredentials: true });

    socketRef.current.on("connect", () => {
      // join room = adminId
      if (adminId) socketRef.current.emit("join_chat", adminId);
    });

    socketRef.current.on("receive_message", (msg) => {
      // msg has sender/receiver/text
      const s = String(msg?.sender || "");
      const r = String(msg?.receiver || "");
      // update list and current messages
      setMessages((prev) => {
        if (!active) return prev;
        const partner = active.userId;
        // show only messages for active partner
        if (
          (s === adminId && r === partner) ||
          (s === partner && r === adminId)
        ) {
          return [...prev, msg];
        }
        return prev;
      });

      // refresh conversations list
      loadConversations();
      setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 50);
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line
  }, [adminId, active?.userId]);

  return (
    <>
      <PageHeader
        title="Chat"
        subtitle="Admin chat-conversations + messages + socket.io."
        actions={<button className="btn" onClick={loadConversations}>Refresh</button>}
      />

      <div className="grid cols-2" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="card-head">
            <div style={{ fontWeight: 900 }}>Conversations</div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div style={{ maxHeight: "68vh", overflow: "auto" }}>
              {(conversations || []).map((c) => {
                const isActive = active?.userId === c.userId;
                return (
                  <button
                    key={c.userId}
                    className="btn"
                    style={{
                      width: "100%",
                      borderRadius: 0,
                      textAlign: "left",
                      border: "none",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      background: isActive ? "rgba(110,231,255,0.10)" : "transparent",
                      padding: 12,
                    }}
                    onClick={() => {
                      setActive(c);
                      loadMessages(c.userId);
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 800 }}>{c.userName || c.userId}</div>
                      {c.unreadCount ? <span className="badge warn">{c.unreadCount} unread</span> : <span className="badge">read</span>}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                      {c.lastMessage || ""}
                    </div>
                  </button>
                );
              })}
              {!conversations?.length ? (
                <div style={{ padding: 14, opacity: 0.7 }}>No conversations</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div style={{ fontWeight: 900 }}>
              {active ? `Dialog: ${active.userName || active.userId}` : "Select conversation"}
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            <div
              ref={listRef}
              style={{ height: "56vh", overflow: "auto", padding: 14, display: "grid", gap: 10 }}
            >
              {messages.map((m) => {
                const mine = String(m.sender) === adminId;
                return (
                  <div
                    key={m._id || `${m.sender}-${m.receiver}-${m.createdAt}-${Math.random()}`}
                    style={{
                      marginLeft: mine ? "auto" : 0,
                      maxWidth: "78%",
                      background: mine ? "rgba(110,231,255,0.14)" : "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 14,
                      padding: 10,
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                      {mine ? "Admin" : "User"} • {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                  </div>
                );
              })}
              {!messages?.length ? <div style={{ opacity: 0.7 }}>No messages</div> : null}
            </div>

            {active ? (
              <div style={{ padding: 14, borderTop: "1px solid rgba(255,255,255,0.10)", display: "flex", gap: 10 }}>
                <input
                  className="input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type message…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      document.getElementById("adminSendBtn")?.click();
                    }
                  }}
                />
                <button
                  id="adminSendBtn"
                  className="btn primary"
                  onClick={() => {
                    const t = String(text || "").trim();
                    if (!t) return;

                    if (!socketRef.current) {
                      toast.error("Socket not connected");
                      return;
                    }

                    socketRef.current.emit("send_message", {
                      sender: adminId,
                      receiver: active.userId,
                      text: t,
                      isGuest: !!active.isGuest,
                    });

                    setText("");
                  }}
                >
                  Send
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
