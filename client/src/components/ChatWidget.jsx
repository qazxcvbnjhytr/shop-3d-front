import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaComments, FaTimes } from "react-icons/fa";
import io from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import ChatBox from "./ChatBox";
import "../styles/chatWidget.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const ADMIN_ID = "69486848fd50e39e9a7537b0";

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  // ✅ один сокет на весь віджет
  const socketRef = useRef(null);
  if (!socketRef.current) {
    socketRef.current = io(API_URL, { transports: ["websocket"] });
  }
  const socket = socketRef.current;

  const myId = useMemo(() => {
    if (user?._id) return String(user._id);

    let gid = localStorage.getItem("guest_chat_id");
    if (!gid) {
      gid = "guest_" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem("guest_chat_id", gid);
    }
    return gid;
  }, [user?._id]);

  // join room
  useEffect(() => {
    if (!myId) return;
    socket.emit("join_chat", myId);
  }, [socket, myId]);

  // receive messages: badge logic
  useEffect(() => {
    const onReceive = (msg) => {
      const fromAdmin = String(msg?.sender) === String(ADMIN_ID);
      const toMe = String(msg?.receiver) === String(myId);

      if (!fromAdmin || !toMe) return;

      if (!isOpen) {
        setUnread((u) => u + 1);
      } else {
        // якщо чат відкритий — прочитано
        socket.emit("mark_read", { myId, partnerId: ADMIN_ID });
      }
    };

    socket.on("receive_message", onReceive);
    return () => socket.off("receive_message", onReceive);
  }, [socket, isOpen, myId]);

  // open chat: clear badge + mark read
  useEffect(() => {
    if (!isOpen) return;
    setUnread(0);
    socket.emit("mark_read", { myId, partnerId: ADMIN_ID });
  }, [socket, isOpen, myId]);

  return (
    <div className="chat-widget-wrapper">
      {isOpen && (
        <div className="chat-window-container">
          <div className="chat-window-header">
            <h4>Підтримка Forest Guide</h4>
            <button onClick={() => setIsOpen(false)} aria-label="Close chat">
              <FaTimes />
            </button>
          </div>

          <ChatBox receiverId={ADMIN_ID} socket={socket} myId={myId} isOpen={isOpen} />
        </div>
      )}

      <button className="chat-fab" onClick={() => setIsOpen((v) => !v)} aria-label="Open chat">
        {isOpen ? <FaTimes size={24} /> : <FaComments size={24} />}
        {!isOpen && unread > 0 && <span className="chat-badge">{unread}</span>}
      </button>
    </div>
  );
}
