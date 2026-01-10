import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaComments, FaTimes } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import ChatBox from "./ChatBox";
import { getSocket, API_BASE_URL } from "../chat/socket";
import "../styles/chatWidget.css";

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [adminId, setAdminId] = useState("");

  const socket = useMemo(() => getSocket(), []);
  const joinedRef = useRef(false);

  const myId = useMemo(() => {
    if (user?._id) return String(user._id);

    let gid = localStorage.getItem("guest_chat_id");
    if (!gid) {
      gid = "guest_" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("guest_chat_id", gid);
    }
    return gid;
  }, [user?._id]);

  // 1) отримати support admin id (без токена)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/chat/support-admin`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "support-admin error");
        if (alive) setAdminId(String(data.adminId || ""));
      } catch (e) {
        console.warn("[ChatWidget] support-admin error:", e?.message);
        if (alive) setAdminId("");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // 2) join room once
  useEffect(() => {
    if (!myId) return;
    if (joinedRef.current) return;

    socket.emit("join_chat", myId);
    joinedRef.current = true;
  }, [socket, myId]);

  // 3) badge logic (тільки якщо прийшло від адміна до мене)
  useEffect(() => {
    const onReceive = (msg) => {
      if (!msg) return;

      const fromAdmin = adminId && String(msg.sender) === String(adminId);
      const toMe = String(msg.receiver) === String(myId);
      if (!fromAdmin || !toMe) return;

      if (!isOpen) setUnread((u) => u + 1);
      else socket.emit("mark_read", { myId, partnerId: adminId });
    };

    socket.on("receive_message", onReceive);
    return () => socket.off("receive_message", onReceive);
  }, [socket, isOpen, myId, adminId]);

  // 4) when open -> mark read
  useEffect(() => {
    if (!isOpen) return;
    setUnread(0);
    if (adminId) socket.emit("mark_read", { myId, partnerId: adminId });
  }, [socket, isOpen, myId, adminId]);

  return (
    <div className="cw">
      {isOpen && (
        <div className="cw-window">
          <div className="cw-head">
            <div>
              <div className="cw-title">Підтримка MebliHub</div>
              <div className="cw-sub">Відповімо найближчим часом</div>
            </div>
            <button className="cw-iconbtn" onClick={() => setIsOpen(false)} aria-label="Close chat">
              <FaTimes />
            </button>
          </div>

          {/* ✅ завжди показуємо поле вводу.
              Якщо adminId ще не підвантажився — просто disable */}
          <ChatBox
            receiverId={adminId}
            socket={socket}
            myId={myId}
            disabled={!adminId}
          />
        </div>
      )}

      <button className="cw-fab" onClick={() => setIsOpen((v) => !v)} aria-label="Open chat">
        {isOpen ? <FaTimes size={22} /> : <FaComments size={22} />}
        {!isOpen && unread > 0 && <span className="cw-badge">{unread}</span>}
      </button>
    </div>
  );
}
