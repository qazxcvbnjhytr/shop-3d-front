// client/src/admin/pages/AdminProducts.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import PageHeader from "../components/PageHeader.jsx";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import FormRow from "../components/FormRow.jsx";
import Confirm from "../components/Confirm.jsx";
import ImageUploader from "../components/ImageUploader.jsx";
import { adminApi, API_URL } from "../api/adminApi.js";
import { endpoints } from "../api/endpoints.js";
import { useToast } from "../components/Toast.jsx";

import "./AdminProducts.css";

/** =========================
 * Helpers
 * ========================= */
const absUrl = (src) => {
  if (!src) return "";
  if (String(src).startsWith("http")) return src;
  return `${API_URL}${String(src).startsWith("/") ? src : `/${src}`}`;
};

const toCsv = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");
const fromCsv = (s) =>
  String(s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const defaultForm = {
  name_ua: "",
  name_en: "",
  description_ua: "",
  description_en: "",
  slug: "",
  category: "",
  subCategory: "",
  typeKey: "",
  price: 0,
  discount: 0,
  inStock: true,
  stockQty: 0,
  status: "active",

  styleKeys: "",
  colorKeys: "",
  roomKeys: "",
  collectionKeys: "",
  featureKeys: "",

  specificationsJson: "{}", // must be valid JSON object

  imagesToAdd: [],
  modelFile: null,

  keepImages: [],
};

const productToForm = (p) => ({
  ...defaultForm,
  name_ua: p?.name?.ua || "",
  name_en: p?.name?.en || "",
  description_ua: p?.description?.ua || "",
  description_en: p?.description?.en || "",
  slug: p?.slug || "",
  category: p?.category || "",
  subCategory: p?.subCategory || "",
  typeKey: p?.typeKey || "",
  price: p?.price ?? 0,
  discount: p?.discount ?? 0,
  inStock: !!p?.inStock,
  stockQty: p?.stockQty ?? 0,
  status: p?.status || "active",

  styleKeys: toCsv(p?.styleKeys),
  colorKeys: toCsv(p?.colorKeys),
  roomKeys: toCsv(p?.roomKeys),
  collectionKeys: toCsv(p?.collectionKeys),
  featureKeys: toCsv(p?.featureKeys),

  specificationsJson: JSON.stringify(p?.specifications || {}, null, 2),

  imagesToAdd: [],
  modelFile: null,
  keepImages: Array.isArray(p?.images) ? p.images : [],
});

const validateForm = (form) => {
  if (!form.name_ua?.trim() || !form.name_en?.trim()) return "Name UA/EN are required";
  if (!form.slug?.trim()) return "Slug is required";
  if (!form.category?.trim()) return "Category is required";

  try {
    const parsed = JSON.parse(form.specificationsJson || "{}");
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) return "Specifications JSON must be an object {}";
  } catch {
    return "Specifications JSON is invalid";
  }

  const price = Number(form.price);
  if (!Number.isFinite(price) || price < 0) return "Price must be >= 0";

  const discount = Number(form.discount);
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) return "Discount must be 0..100";

  const qty = Number(form.stockQty);
  if (!Number.isFinite(qty) || qty < 0) return "Stock qty must be >= 0";

  return null;
};

const buildFormData = (form, { isEdit }) => {
  const fd = new FormData();

  fd.append("name", JSON.stringify({ ua: form.name_ua, en: form.name_en }));
  fd.append("description", JSON.stringify({ ua: form.description_ua, en: form.description_en }));

  fd.append("slug", String(form.slug || "").trim());
  fd.append("category", String(form.category || "").trim());
  fd.append("subCategory", String(form.subCategory || "").trim());
  fd.append("typeKey", String(form.typeKey || "").trim());

  fd.append("price", String(Number(form.price) || 0));
  fd.append("discount", String(Number(form.discount) || 0));
  fd.append("inStock", String(!!form.inStock));
  fd.append("stockQty", String(Number(form.stockQty) || 0));
  fd.append("status", String(form.status || "active"));

  fd.append("styleKeys", JSON.stringify(fromCsv(form.styleKeys)));
  fd.append("colorKeys", JSON.stringify(fromCsv(form.colorKeys)));
  fd.append("roomKeys", JSON.stringify(fromCsv(form.roomKeys)));
  fd.append("collectionKeys", JSON.stringify(fromCsv(form.collectionKeys)));
  fd.append("featureKeys", JSON.stringify(fromCsv(form.featureKeys)));

  if (isEdit) fd.append("keepImages", JSON.stringify(form.keepImages || []));
  fd.append("specifications", form.specificationsJson || "{}");

  (form.imagesToAdd || []).forEach((f) => fd.append("images", f));
  if (form.modelFile) fd.append("modelFile", form.modelFile);

  return fd;
};

const statusLabel = (status) => (status === "active" ? "Active" : "Archived");

export default function AdminProducts() {
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const safeSetForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const [prodRes, catRes] = await Promise.allSettled([
        adminApi.get(endpoints.adminProducts),
        adminApi.get(endpoints.adminCategories).catch(() => adminApi.get(endpoints.categoriesPublic)),
      ]);

      const products = prodRes.status === "fulfilled" ? prodRes.value.data : [];
      const categories = catRes.status === "fulfilled" ? catRes.value.data : [];

      setRows(Array.isArray(products) ? products : []);
      setCats(Array.isArray(categories) ? categories : []);
    } catch (e) {
      toast.error(e?.friendlyMessage || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm(productToForm(p));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(defaultForm);
  };

  const submit = async () => {
    const err = validateForm(form);
    if (err) return toast.error(err);

    try {
      const isEdit = !!editing?._id;
      const fd = buildFormData(form, { isEdit });

      if (isEdit) {
        await adminApi.put(endpoints.adminProductById(editing._id), fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Product updated");
      } else {
        await adminApi.post(endpoints.adminProducts, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Product created");
      }

      closeModal();
      await load();
    } catch (e) {
      toast.error(e?.friendlyMessage || "Save failed");
    }
  };

  const askDelete = (p) => {
    setDeleting(p);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    try {
      if (!deleting?._id) return;
      await adminApi.delete(endpoints.adminProductById(deleting._id));
      toast.success("Deleted");
      setConfirmOpen(false);
      setDeleting(null);
      await load();
    } catch (e) {
      toast.error(e?.friendlyMessage || "Delete failed");
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Product",
        key: "product",
        render: (r) => {
          const first = Array.isArray(r.images) ? r.images[0] : "";
          return (
            <div className="ap-productCell">
              <div className="ap-thumbWrap">
                {first ? (
                  <img className="ap-thumb" alt="" src={absUrl(first)} />
                ) : (
                  <div className="ap-thumbPlaceholder">—</div>
                )}
              </div>

              <div className="ap-prodMeta">
                <div className="ap-prodTitle">
                  <span className="ap-prodUa">{r?.name?.ua || ""}</span>
                </div>

                <div className="ap-prodSub">
                  <span className="ap-muted">Slug:</span> <span className="ap-mono">{r?.slug || ""}</span>
                </div>

                <div className="ap-prodSub">
                  <span className="ap-muted">Cat/Sub:</span>{" "}
                  <span className="ap-mono">{r?.category || ""}</span>
                  <span className="ap-sep">/</span>
                  <span className="ap-mono">{r?.subCategory || "-"}</span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        header: "Pricing",
        key: "pricing",
        render: (r) => {
          const hasDiscount = Number(r?.discount || 0) > 0;
          return (
            <div className="ap-stack">
              <div className="ap-line">
                <span className="ap-label">Price</span>
                <span className="ap-value ap-mono">{r?.price ?? 0}</span>
              </div>
              <div className="ap-line">
                <span className="ap-label">Discount</span>
                {hasDiscount ? (
                  <span className="badge warn">-{r.discount}%</span>
                ) : (
                  <span className="badge">0%</span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        header: "Stock",
        key: "stock",
        render: (r) => (
          <div className="ap-stack">
            <div className="ap-line">
              <span className="ap-label">Availability</span>
              {r?.inStock ? <span className="badge ok">In stock</span> : <span className="badge danger">Out</span>}
            </div>

            <div className="ap-line">
              <span className="ap-label">Qty</span>
              <span className="ap-value ap-mono">{r?.stockQty ?? 0}</span>
            </div>
          </div>
        ),
      },
      {
        header: "Status",
        key: "status",
        render: (r) => (
          <div className="ap-statusCell">
            <span className={r?.status === "active" ? "badge ok" : "badge"}>{statusLabel(r?.status)}</span>
          </div>
        ),
      },
      {
        header: "Actions",
        key: "actions",
        render: (r) => (
          <div className="ap-actions">
            <button className="btn" onClick={() => openEdit(r)}>
              Edit
            </button>
            <button className="btn danger" onClick={() => askDelete(r)}>
              Delete
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const modalTitle = editing ? `Edit product: ${editing?.slug}` : "Create product";

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="CRUD products with images + optional model upload."
        actions={
          <button className="btn primary" onClick={openCreate}>
            + New Product
          </button>
        }
      />

      {loading ? (
        <div className="card">
          <div className="card-body ap-loading">Loading…</div>
        </div>
      ) : (
        <DataTable columns={columns} rows={rows} />
      )}

      <Modal
        open={modalOpen}
        title={modalTitle}
        onClose={closeModal}
        footer={
          <div className="ap-modalFooter">
            <button className="btn" onClick={closeModal}>
              Cancel
            </button>
            <button className="btn primary" onClick={submit}>
              Save
            </button>
          </div>
        }
      >
        <div className="row">
          <FormRow label="Name UA">
            <input className="input" value={form.name_ua} onChange={(e) => safeSetForm({ name_ua: e.target.value })} />
          </FormRow>
          <FormRow label="Name EN">
            <input className="input" value={form.name_en} onChange={(e) => safeSetForm({ name_en: e.target.value })} />
          </FormRow>
        </div>

        <div className="row ap-mt">
          <FormRow label="Description UA">
            <textarea className="textarea" value={form.description_ua} onChange={(e) => safeSetForm({ description_ua: e.target.value })} />
          </FormRow>
          <FormRow label="Description EN">
            <textarea className="textarea" value={form.description_en} onChange={(e) => safeSetForm({ description_en: e.target.value })} />
          </FormRow>
        </div>

        <div className="row3 ap-mt">
          <FormRow label="Slug">
            <input className="input" value={form.slug} onChange={(e) => safeSetForm({ slug: e.target.value })} />
          </FormRow>

          <FormRow label="Category">
            <select className="select" value={form.category} onChange={(e) => safeSetForm({ category: e.target.value })}>
              <option value="">Select…</option>
              {cats.map((c) => (
                <option key={c._id || c.category} value={c.category}>
                  {c.category} — {c?.names?.ua || ""}
                </option>
              ))}
            </select>
          </FormRow>

          <FormRow label="SubCategory">
            <input className="input" value={form.subCategory} onChange={(e) => safeSetForm({ subCategory: e.target.value })} placeholder="straight" />
          </FormRow>
        </div>

        <div className="row3 ap-mt">
          <FormRow label="TypeKey">
            <input className="input" value={form.typeKey} onChange={(e) => safeSetForm({ typeKey: e.target.value })} placeholder="sofa_straight" />
          </FormRow>

          <FormRow label="Price">
            <input className="input" type="number" value={form.price} onChange={(e) => safeSetForm({ price: Number(e.target.value) })} />
          </FormRow>

          <FormRow label="Discount %">
            <input className="input" type="number" value={form.discount} onChange={(e) => safeSetForm({ discount: Number(e.target.value) })} />
          </FormRow>
        </div>

        <div className="row3 ap-mt">
          <FormRow label="In stock">
            <select className="select" value={String(form.inStock)} onChange={(e) => safeSetForm({ inStock: e.target.value === "true" })}>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </FormRow>

          <FormRow label="Stock qty">
            <input className="input" type="number" value={form.stockQty} onChange={(e) => safeSetForm({ stockQty: Number(e.target.value) })} />
          </FormRow>

          <FormRow label="Status">
            <select className="select" value={form.status} onChange={(e) => safeSetForm({ status: e.target.value })}>
              <option value="active">active</option>
              <option value="archived">archived</option>
            </select>
          </FormRow>
        </div>

        <div className="row ap-mt">
          <FormRow label="styleKeys (csv)">
            <input className="input" value={form.styleKeys} onChange={(e) => safeSetForm({ styleKeys: e.target.value })} />
          </FormRow>

          <FormRow label="colorKeys (csv)">
            <input className="input" value={form.colorKeys} onChange={(e) => safeSetForm({ colorKeys: e.target.value })} />
          </FormRow>
        </div>

        <div className="row ap-mt">
          <FormRow label="roomKeys (csv)">
            <input className="input" value={form.roomKeys} onChange={(e) => safeSetForm({ roomKeys: e.target.value })} />
          </FormRow>

          <FormRow label="collectionKeys (csv)">
            <input className="input" value={form.collectionKeys} onChange={(e) => safeSetForm({ collectionKeys: e.target.value })} />
          </FormRow>
        </div>

        <div className="row ap-mt">
          <FormRow label="featureKeys (csv)">
            <input className="input" value={form.featureKeys} onChange={(e) => safeSetForm({ featureKeys: e.target.value })} />
          </FormRow>

          <FormRow label="Specifications JSON" hint="Must be a valid JSON object.">
            <textarea className="textarea" value={form.specificationsJson} onChange={(e) => safeSetForm({ specificationsJson: e.target.value })} />
          </FormRow>
        </div>

        {editing?._id && Array.isArray(form.keepImages) && form.keepImages.length ? (
          <div className="ap-mt">
            <FormRow label="Existing images (keep/remove)">
              <div className="ap-imgGrid">
                {form.keepImages.map((img) => (
                  <div key={img} className="ap-imgItem">
                    <img className="ap-img" src={absUrl(img)} alt="" />
                    <button
                      className="btn danger ap-imgRemove"
                      onClick={() => safeSetForm({ keepImages: form.keepImages.filter((x) => x !== img) })}
                      type="button"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </FormRow>
          </div>
        ) : null}

        <div className="ap-mt">
          <ImageUploader
            label="Add images (files)"
            multiple
            value={form.imagesToAdd}
            onChange={(files) => safeSetForm({ imagesToAdd: files })}
            hint="Uploads as multipart field 'images'."
          />
        </div>

        <div className="ap-mt">
          <FormRow label="Model file (optional)" hint="multipart field 'modelFile'">
            <input className="input" type="file" accept=".glb,.gltf,model/*" onChange={(e) => safeSetForm({ modelFile: e.target.files?.[0] || null })} />
          </FormRow>
        </div>
      </Modal>

      <Confirm
        open={confirmOpen}
        title="Delete product"
        text={`Delete product "${deleting?.slug}"? This action cannot be undone.`}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleting(null);
        }}
        onConfirm={doDelete}
      />
    </>
  );
}
