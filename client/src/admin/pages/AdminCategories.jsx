// client/src/admin/pages/AdminCategories.jsx
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
  // категории могут быть в /uploads или в /img/public
  return `${API_URL}${src.startsWith("/") ? src : `/${src}`}`;
};

export default function AdminCategories() {
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const empty = {
    category: "",
    name_ua: "",
    name_en: "",
    order: 0,
    imageUrl: "",
    imageFile: null,
  };

  const [form, setForm] = useState(empty);

  const load = async () => {
    try {
      setLoading(true);
      const r = await adminApi.get(endpoints.adminCategories);
      setRows(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      toast.error(e.friendlyMessage || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const columns = useMemo(() => [
    {
      header: "Image",
      key: "image",
      render: (r) =>
        r.image ? (
          <img
            alt=""
            src={absUrl(r.image)}
            style={{ width: 64, height: 44, borderRadius: 10, objectFit: "cover", border: "1px solid rgba(255,255,255,0.12)" }}
          />
        ) : (
          <span style={{ opacity: 0.6 }}>—</span>
        ),
    },
    { header: "Key", key: "category", render: (r) => <b>{r.category}</b> },
    { header: "UA", key: "ua", render: (r) => r?.names?.ua || "" },
    { header: "EN", key: "en", render: (r) => r?.names?.en || "" },
    { header: "Order", key: "order" },
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
                category: r.category || "",
                name_ua: r?.names?.ua || "",
                name_en: r?.names?.en || "",
                order: r.order ?? 0,
                imageUrl: r.image || "",
                imageFile: null,
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
  ], []);

  const submit = async () => {
    try {
      const fd = new FormData();
      fd.append("category", form.category);
      fd.append("name_ua", form.name_ua);
      fd.append("name_en", form.name_en);
      fd.append("order", String(form.order ?? 0));
      if (form.imageUrl) fd.append("imageUrl", form.imageUrl);
      if (form.imageFile) fd.append("image", form.imageFile);

      if (!form.category || !form.name_ua || !form.name_en) {
        toast.error("category + name_ua + name_en are required");
        return;
      }

      if (editing?._id) {
        await adminApi.put(endpoints.adminCategoryById(editing._id), fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Category updated");
      } else {
        await adminApi.post(endpoints.adminCategories, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Category created");
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
      await adminApi.delete(endpoints.adminCategoryById(deleting._id));
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
        title="Categories"
        subtitle="CRUD parent categories (image upload supported)."
        actions={
          <button
            className="btn primary"
            onClick={() => {
              setEditing(null);
              setForm(empty);
              setModalOpen(true);
            }}
          >
            + New Category
          </button>
        }
      />

      {loading ? (
        <div className="card"><div className="card-body" style={{ opacity: 0.7 }}>Loading…</div></div>
      ) : (
        <DataTable columns={columns} rows={rows} />
      )}

      <Modal
        open={modalOpen}
        title={editing ? `Edit: ${editing.category}` : "Create category"}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        footer={
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button className="btn" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn primary" onClick={submit}>Save</button>
          </div>
        }
      >
        <div className="row">
          <FormRow label="Category key (slug)">
            <input
              className="input"
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              placeholder="sofas"
              disabled={!!editing}
            />
          </FormRow>

          <FormRow label="Order">
            <input
              className="input"
              type="number"
              value={form.order}
              onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) }))}
            />
          </FormRow>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <FormRow label="Name UA">
            <input
              className="input"
              value={form.name_ua}
              onChange={(e) => setForm((p) => ({ ...p, name_ua: e.target.value }))}
            />
          </FormRow>

          <FormRow label="Name EN">
            <input
              className="input"
              value={form.name_en}
              onChange={(e) => setForm((p) => ({ ...p, name_en: e.target.value }))}
            />
          </FormRow>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <FormRow label="Image URL (optional)" hint="If you don't upload a file, URL will be used.">
            <input
              className="input"
              value={form.imageUrl}
              onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
              placeholder="/img/catalog/sofa.jpg or /uploads/categories/sofas/....png"
            />
          </FormRow>

          <FormRow label="Upload image file (optional)">
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => setForm((p) => ({ ...p, imageFile: e.target.files?.[0] || null }))}
            />
          </FormRow>
        </div>
      </Modal>

      <Confirm
        open={confirmOpen}
        title="Delete category"
        text={`Delete category "${deleting?.category}"? This action cannot be undone.`}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleting(null);
        }}
        onConfirm={doDelete}
      />
    </>
  );
}
