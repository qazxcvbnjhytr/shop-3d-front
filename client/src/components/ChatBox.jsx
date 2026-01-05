import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "../styles/chatWidget.css";

const socket = io("http://localhost:5000", { transports: ["websocket"] });

export default function ChatBox({ receiverId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const scrollRef = useRef();

  const getMyId = () => {
    if (user?._id) return user._id;
    let gid = localStorage.getItem("guest_chat_id");
    if (!gid) {
      gid = "guest_" + Math.random().toString(36).substring(7);
      localStorage.setItem("guest_chat_id", gid);
    }
    return gid;
  };
  const myId = getMyId();

  useEffect(() => {
    socket.emit("join_chat", myId);
    
    axios.get(`http://localhost:5000/api/messages/${myId}/${receiverId}`).then(res => {
        setMessages(res.data);
        // Відкрили чат - значить прочитали повідомлення адміна
        socket.emit("mark_read", { myId, partnerId: receiverId });
    });

    socket.on("receive_message", (msg) => {
      if (msg.sender === receiverId || msg.sender === myId) {
        setMessages(prev => {
            if (prev.some(m => m._id === msg._id)) return prev;
            return [...prev, msg];
        });
        if (msg.sender === receiverId) socket.emit("mark_read", { myId, partnerId: receiverId });
      }
    });

    socket.on("messages_read_update", () => {
       setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    });

    return () => { socket.off("receive_message"); socket.off("messages_read_update"); };
  }, []);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const data = { sender: myId, receiver: receiverId, text: text.trim(), isGuest: !user?._id };
    socket.emit("send_message", data);
    setText("");
  };

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="user-chat-box">
      <div className="user-chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`u-msg-row ${m.sender === myId ? "me" : "them"}`}>
            <div className="u-msg-bubble">
              {m.text}
              {m.sender === myId && (
                 <span className={`msg-status ${m.isRead ? "status-read" : "status-sent"}`}>
                   {m.isRead ? "✓✓" : "✓"}
                 </span>
              )}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
      <form onSubmit={send} className="user-chat-input">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Повідомлення..." />
        <button type="submit">➤</button>
      </form>
    </div>
  );
}