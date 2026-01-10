import React, { useEffect, useMemo, useState } from "react";
import { 
  FaUserPlus, 
  FaSearch, 
  FaEdit, 
  FaTrash, 
  FaUserShield, 
  FaUser, 
  FaCircle 
} from "react-icons/fa";
import PageHeader from "../components/PageHeader.jsx";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import FormRow from "../components/FormRow.jsx";
import Confirm from "../components/Confirm.jsx";
import { adminApi, API_URL } from "../api/adminApi.js";
import { endpoints } from "../api/endpoints.js";
import { useToast } from "../components/Toast.jsx";

import "./AdminUsers.css";

const absUrl = (src) => {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  return `${API_URL}${src.startsWith("/") ? src : `/${src}`}`;
};

const RoleBadge = ({ role }) => {
  if (role === "admin") {
    return <span className="role-badge admin"><FaUserShield /> Admin</span>;
  }
  return <span className="role-badge user"><FaUser /> User</span>;
};

export default function AdminUsers() {
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const empty = {
    firstName: "",
    lastName: "",
    email: "",
    role: "user",
    status: "active",
    password: "",
  };

  const [form, setForm] = useState(empty);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await adminApi.get(endpoints.adminUsers);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e.friendlyMessage || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;
    const lower = searchTerm.toLowerCase();
    // 🔥 ВИПРАВЛЕНО: Шукаємо по name, бо firstName може не бути в об'єкті
    return rows.filter(
      (r) =>
        (r.name && r.name.toLowerCase().includes(lower)) ||
        (r.email && r.email.toLowerCase().includes(lower))
    );
  }, [rows, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      online: rows.filter(r => r.isOnline).length,
      banned: rows.filter(r => r.status === "banned").length
    };
  }, [rows]);

  const columns = useMemo(
    () => [
      {
        header: "User Profile",
        key: "user",
        render: (r) => (
          <div className="au-user-cell">
            <div className="au-avatar-wrapper">
              <img
                src={r.avatar ? absUrl(r.avatar) : "https://via.placeholder.com/40"}
                alt="avatar"
                className="au-avatar"
              />
              <span className={`au-status-dot ${r.isOnline ? "online" : "offline"}`} title={r.isOnline ? "Online" : "Offline"}></span>
            </div>
            <div className="au-user-info">
              {/* 🔥 ВИПРАВЛЕНО: Виводимо r.name, а не firstName/lastName */}
              <div className="au-name">{r.name || "No Name"}</div>
              <div className="au-email">{r.email}</div>
            </div>
          </div>
        ),
      },
      {
        header: "Role",
        key: "role",
        render: (r) => <RoleBadge role={r.role} />,
      },
      {
        header: "Presence",
        key: "presence",
        render: (r) => (
            <div className={`au-presence-tag ${r.isOnline ? "online" : "offline"}`}>
                <FaCircle size={8} />
                {r.isOnline ? "Online" : "Offline"}
            </div>
        )
      },
      {
        header: "Account Status",
        key: "status",
        render: (r) => (
          <span className={`au-account-badge ${r.status}`}>
            {r.status === "active" ? "Active" : "Banned"}
          </span>
        ),
      },
      {
        header: "",
        key: "actions",
        render: (r) => (
          <div className="au-actions">
            <button
              className="au-icon-btn edit"
              title="Edit User"
              onClick={() => {
                setEditing(r);
                
                // 🔥 МАГІЯ ТУТ: Розбиваємо "name" на "firstName" і "lastName"
                const fullName = r.name || "";
                const parts = fullName.split(" ");
                const fName = parts[0] || "";
                const lName = parts.slice(1).join(" ") || "";

                setForm({
                  firstName: fName,
                  lastName: lName,
                  email: r.email || "",
                  role: r.role || "user",
                  status: r.status || "active",
                  password: "",
                });
                setModalOpen(true);
              }}
            >
              <FaEdit />
            </button>
            <button
              className="au-icon-btn delete"
              title="Delete User"
              onClick={() => {
                setDeleting(r);
                setConfirmOpen(true);
              }}
            >
              <FaTrash />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const submit = async () => {
    try {
      if (!form.email || !form.firstName) return toast.error("Email and Name are required");
      if (!editing && !form.password) return toast.error("Password is required for new user");

      const payload = { ...form };
      if (!payload.password) delete payload.password;

      if (editing?._id) {
        await adminApi.put(endpoints.adminUserById(editing._id), payload);
        toast.success("User updated");
      } else {
        await adminApi.post(endpoints.adminUsers, payload);
        toast.success("User created");
      }

      setModalOpen(false);
      setEditing(null);
      setForm(empty);
      await load();
    } catch (e) {
      toast.error(e.friendlyMessage || "Save failed");
    }
  };

  const doDelete = async () => {
    try {
      await adminApi.delete(endpoints.adminUserById(deleting._id));
      toast.success("Deleted");
      setConfirmOpen(false);
      setDeleting(null);
      await load();
    } catch (e) {
      toast.error(e.friendlyMessage || "Delete failed");
    }
  };

  return (
    <div className="au-container">
      <div className="au-header-wrapper">
        <PageHeader
          title="Users Management"
          subtitle="Manage access, roles and user profiles."
          actions={
            <button
              className="au-btn-primary"
              onClick={() => {
                setEditing(null);
                setForm(empty);
                setModalOpen(true);
              }}
            >
              <FaUserPlus /> Add User
            </button>
          }
        />

        <div className="au-stats-row">
            <div className="au-stat-card">
                <span className="label">Total Users</span>
                <span className="value">{stats.total}</span>
            </div>
            <div className="au-stat-card online">
                <span className="label">Online Now</span>
                <span className="value">{stats.online}</span>
            </div>
            <div className="au-stat-card banned">
                <span className="label">Banned</span>
                <span className="value">{stats.banned}</span>
            </div>
        </div>

        <div className="au-toolbar">
            <div className="au-search-box">
                <FaSearch className="icon"/>
                <input 
                    placeholder="Search by name or email..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      <div className="au-content">
        {loading ? (
            <div className="au-loading">Loading users...</div>
        ) : (
            <div className="au-table-card">
                 <DataTable columns={columns} rows={filteredRows} />
            </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editing ? "Edit User" : "Create New User"}
        onClose={() => setModalOpen(false)}
        footer={
          <div className="au-modal-footer">
            <button className="au-btn-text" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="au-btn-primary" onClick={submit}>
              Save User
            </button>
          </div>
        }
      >
        <div className="au-form-grid">
            <div className="au-form-section">
                <h3>Personal Info</h3>
                <div className="row">
                    <FormRow label="First Name">
                        <input className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                    </FormRow>
                    <FormRow label="Last Name">
                        <input className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                    </FormRow>
                </div>
                <div className="row mt-2">
                    <FormRow label="Email">
                        <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </FormRow>
                    <FormRow label="Password" hint={editing ? "Leave blank to keep current" : "Required for new user"}>
                        <input className="input" type="password" placeholder="••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    </FormRow>
                </div>
            </div>

            <div className="au-form-section">
                <h3>Access Control</h3>
                <div className="row">
                    <FormRow label="Role">
                        <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </FormRow>
                    <FormRow label="Account Status">
                         <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                            <option value="active">Active (OK)</option>
                            <option value="banned">Banned (Blocked)</option>
                        </select>
                    </FormRow>
                </div>
            </div>
        </div>
      </Modal>

      <Confirm
        open={confirmOpen}
        title="Delete User"
        text={`Permanently delete ${deleting?.email}?`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={doDelete}
      />
    </div>
  );
}