import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL } from "../chat/socket";
import "./ChatBox.css";

const str = (v) => (v == null ? "" : String(v));
const same = (a, b) => str(a) === str(b);

export default function ChatBox({ receiverId, socket, myId, disabled = false }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  const isGuest = useMemo(() => String(myId || "").startsWith("guest_"), [myId]);

  // greeting (локально, щоб завжди було)
  useEffect(() => {
    setMessages((prev) => {
      if (prev.some((m) => m._local === "hello")) return prev;
      return [
        {
          _local: "hello",
          sender: "system",
          receiver: myId,
          text: "Вітаємо. Напишіть, будь ласка, ваше питання — ми допоможемо.",
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });
  }, [myId]);

  // load history when receiverId ready
  useEffect(() => {
    if (!myId || !receiverId) return;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/messages/${myId}/${receiverId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "History error");
        setMessages((prev) => {
          // зберегти greeting зверху, але підвантажити реальну історію
          const hello = prev.find((m) => m._local === "hello");
          return hello ? [hello, ...(Array.isArray(data) ? data : [])] : (Array.isArray(data) ? data : []);
        });
      } catch (e) {
        // history може впасти, але UI все одно працює
        console.warn("[ChatBox] history error:", e?.message);
      }
    })();
  }, [myId, receiverId]);

  // realtime messages
  useEffect(() => {
    const onMsg = (msg) => {
      if (!msg) return;

      const isChat =
        (same(msg.sender, myId) && same(msg.receiver, receiverId)) ||
        (same(msg.sender, receiverId) && same(msg.receiver, myId));

      if (!isChat) return;

      setMessages((prev) => {
        const id = msg._id ? String(msg._id) : "";
        if (id && prev.some((x) => String(x._id) === id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on("receive_message", onMsg);
    return () => socket.off("receive_message", onMsg);
  }, [socket, myId, receiverId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || !myId || !receiverId || disabled) return;

    socket.emit("send_message", {
      sender: String(myId),
      receiver: String(receiverId),
      text: t,
      isGuest,
    });

    setText("");
  };

  return (
    <div className="cb">
      <div className="cb-msgs">
        {messages.map((m, i) => {
          const mine = same(m.sender, myId);
          const sys = m.sender === "system";
          return (
            <div key={m._id || m._local || i} className={`cb-row ${sys ? "sys" : mine ? "me" : "them"}`}>
              <div className="cb-bubble">
                <div className="cb-text">{m.text}</div>
                <div className="cb-time">
                  {m.createdAt ? new Date(m.createdAt).toLocaleString("uk-UA") : ""}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="cb-input" onSubmit={send}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={disabled ? "Підключення до підтримки…" : "Напишіть нам…"}
          disabled={disabled}
        />
        <button type="submit" disabled={disabled || !text.trim()}>
          Надіслати
        </button>
      </form>
    </div>
  );
}
