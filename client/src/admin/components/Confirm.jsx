// client/src/admin/components/Confirm.jsx
import React from "react";
import Modal from "./Modal.jsx";

export default function Confirm({ open, title = "Confirm", text, onCancel, onConfirm }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn danger" onClick={onConfirm}>Delete</button>
        </div>
      }
    >
      <div style={{ opacity: 0.9 }}>{text}</div>
    </Modal>
  );
}
