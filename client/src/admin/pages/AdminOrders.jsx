import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import FormRow from "../components/FormRow.jsx";
import Confirm from "../components/Confirm.jsx";
import { adminApi, API_URL } from "../api/adminApi.js";
import { endpoints } from "../api/endpoints.js";
import { useToast } from "../components/Toast.jsx";

const absUrl = (src) => {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  return `${API_URL}${src.startsWith("/") ? src : `/${src}`}`;
};

export default function AdminUsers() {
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const empty = {
    firstName: "",
    lastName: "",
    email: "",
    role: "user", // user, admin, manager
    status: "active", // active, banned
    password: "", // Тільки для створення нового
  };

  const [form, setForm] = useState(empty);

  const load = async () => {
    try {
      setLoading(true);
      // Припускаємо, що є ендпоінт GET /admin/users
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
    // eslint-disable-next-line
  }, []);

  const columns = useMemo(
    () => [
      {
        header: "User",
        key: "user",
        render: (r) => (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src={r.avatar ? absUrl(r.avatar) : "https://via.placeholder.com/40"}
              alt="avatar"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            <div>
              <div style={{ fontWeight: "bold" }}>
                {r.firstName} {r.lastName}
              </div>
              <div style={{ fontSize: "0.85em", opacity: 0.7 }}>{r.email}</div>
            </div>
          </div>
        ),
      },
      {
        header: "Role",
        key: "role",
        render: (r) => {
          const color = r.role === "admin" ? "var(--primary)" : "white";
          return <span style={{ color, fontWeight: 500 }}>{r.role}</span>;
        },
      },
      {
        header: "Status",
        key: "status",
        render: (r) =>
          r.status === "active" ? (
            <span className="badge ok">active</span>
          ) : (
            <span className="badge danger">banned</span>
          ),
      },
      {
        header: "Actions",
        key: "actions",
        render: (r) => (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn"
              onClick={() => {
                setEditing(r);
                setForm({
                  firstName: r.firstName || "",
                  lastName: r.lastName || "",
                  email: r.email || "",
                  role: r.role || "user",
                  status: r.status || "active",
                  password: "", // Пароль не показуємо при редагуванні
                });
                setModalOpen(true);
              }}
            >
              Edit
            </button>
            <button
              className="btn danger"
              onClick={() => {
                setDeleting(r);
                setConfirmOpen(true);
              }}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const submit = async () => {
    try {
      // Валідація
      if (!form.email || !form.firstName) return toast.error("Email and Name are required");
      if (!editing && !form.password) return toast.error("Password is required for new user");

      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        role: form.role,
        status: form.status,
      };

      // Додаємо пароль тільки якщо він введений (при створенні або зміні)
      if (form.password) {
        payload.password = form.password;
      }

      if (editing?._id) {
        // Update existing
        await adminApi.put(endpoints.adminUserById(editing._id), payload);
        toast.success("User updated");
      } else {
        // Create new
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
    <>
      <PageHeader
        title="Users"
        subtitle="Manage customers and administrators."
        actions={
          <button
            className="btn primary"
            onClick={() => {
              setEditing(null);
              setForm(empty);
              setModalOpen(true);
            }}
          >
            + New User
          </button>
        }
      />

      {loading ? (
        <div className="card">
          <div className="card-body" style={{ opacity: 0.7 }}>
            Loading users...
          </div>
        </div>
      ) : (
        <DataTable columns={columns} rows={rows} />
      )}

      <Modal
        open={modalOpen}
        title={editing ? `Edit: ${editing.email}` : "Create User"}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        footer={
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button className="btn" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn primary" onClick={submit}>
              Save
            </button>
          </div>
        }
      >
        <div className="row">
          <FormRow label="First Name">
            <input
              className="input"
              value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
            />
          </FormRow>
          <FormRow label="Last Name">
            <input
              className="input"
              value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
            />
          </FormRow>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <FormRow label="Email">
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
          </FormRow>
          <FormRow label={editing ? "Password (leave empty to keep)" : "Password"}>
            <input
              className="input"
              type="password"
              placeholder={editing ? "********" : "Secret123"}
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            />
          </FormRow>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <FormRow label="Role">
            <select
              className="select"
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>
          </FormRow>

          <FormRow label="Status">
            <select
              className="select"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="active">Active</option>
              <option value="banned">Banned</option>
            </select>
          </FormRow>
        </div>
      </Modal>

      <Confirm
        open={confirmOpen}
        title="Delete user"
        text={`Are you sure you want to delete ${deleting?.email}?`}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleting(null);
        }}
        onConfirm={doDelete}
      />
    </>
  );
}