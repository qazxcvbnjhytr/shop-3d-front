import React, { useEffect, useMemo, useState } from "react";
import { createOrdersApi } from "../../api/ordersApi.js";
import "./AdminOrders.css";

const statusOptions = ["", "new", "confirmed", "processing", "shipped", "completed", "cancelled"];

export default function AdminOrders() {
  const token = localStorage.getItem("token") || "";
  const api = useMemo(() => createOrdersApi(() => token), [token]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [active, setActive] = useState(null); // selected order
  const [note, setNote] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [activeStatus, setActiveStatus] = useState("");

  const load = async (page = 1) => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.list({ q, status, page, limit: 20 });
      setData(res);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const openOrder = async (id) => {
    setErr("");
    try {
      const o = await api.getOne(id);
      setActive(o);
      setNote(o?.admin?.note || "");
      setScheduledAt(o?.admin?.scheduledAt ? new Date(o.admin.scheduledAt).toISOString().slice(0, 16) : "");
      setActiveStatus(o?.status || "new");
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Error");
    }
  };

  const saveActive = async () => {
    if (!active?._id) return;
    try {
      const payload = {
        status: activeStatus,
        admin: {
          note,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        },
      };
      const updated = await api.patch(active._id, payload);
      setActive(updated);
      await load(data.page);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Error");
    }
  };

  const cancelOrder = async (id) => {
    const note = prompt("Причина скасування (необов’язково):", "");
    try {
      await api.cancel(id, note || "");
      await load(data.page);
      if (active?._id === id) setActive(null);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Error");
    }
  };

  const deleteOrder = async (id) => {
    if (!confirm("Видалити замовлення назавжди?")) return;
    try {
      await api.remove(id);
      await load(1);
      if (active?._id === id) setActive(null);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Error");
    }
  };

  return (
    <div className="ao">
      <div className="ao-head">
        <div className="ao-title">Orders</div>

        <div className="ao-filters">
          <input
            className="ao-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search: name/phone/email"
          />
          <select className="ao-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s ? s : "all statuses"}
              </option>
            ))}
          </select>
          <button className="ao-btn" onClick={() => load(1)} disabled={loading}>
            Search
          </button>
        </div>
      </div>

      {err && <div className="ao-error">{err}</div>}

      <div className="ao-grid">
        <div className="ao-table">
          <div className="ao-table-head">
            <div>ID</div>
            <div>Customer</div>
            <div>Status</div>
            <div>Total</div>
            <div>Date</div>
            <div>Actions</div>
          </div>

          {loading && <div className="ao-loading">Loading…</div>}

          {!loading && (data.items || []).map((o) => (
            <div key={o._id} className="ao-row">
              <div className="mono">{o._id.slice(-8)}</div>
              <div>
                <div className="strong">{o.customer?.fullName}</div>
                <div className="muted">{o.customer?.phone}</div>
              </div>
              <div><span className={`badge st-${o.status}`}>{o.status}</span></div>
              <div>{Math.round(o?.pricing?.total || 0).toLocaleString("uk-UA")} грн</div>
              <div className="muted">{new Date(o.createdAt).toLocaleString("uk-UA")}</div>
              <div className="ao-actions">
                <button className="link" onClick={() => openOrder(o._id)}>View</button>
                <button className="link warn" onClick={() => cancelOrder(o._id)}>Cancel</button>
                <button className="link danger" onClick={() => deleteOrder(o._id)}>Delete</button>
              </div>
            </div>
          ))}

          {!loading && data.pages > 1 && (
            <div className="ao-pager">
              <button className="ao-btn" disabled={data.page <= 1} onClick={() => load(data.page - 1)}>
                Prev
              </button>
              <div className="muted">
                Page {data.page} / {data.pages} (total {data.total})
              </div>
              <button className="ao-btn" disabled={data.page >= data.pages} onClick={() => load(data.page + 1)}>
                Next
              </button>
            </div>
          )}
        </div>

        <div className="ao-side">
          {!active ? (
            <div className="ao-card">
              <div className="muted">Select an order to view/edit.</div>
            </div>
          ) : (
            <div className="ao-card">
              <div className="ao-card-title">Order {active._id.slice(-8)}</div>

              <div className="ao-block">
                <div className="muted">Customer</div>
                <div className="strong">{active.customer?.fullName}</div>
                <div className="muted">{active.customer?.phone} • {active.customer?.email || "—"}</div>
                <div className="muted">{active.customer?.city}</div>
              </div>

              <div className="ao-block">
                <div className="muted">Delivery</div>
                <div className="strong">{active.delivery?.method}</div>
                {active.delivery?.method === "courier" ? (
                  <div className="muted">{active.delivery?.addressLine}</div>
                ) : (
                  <div className="muted">Pickup location: {String(active.delivery?.locationId || "—")}</div>
                )}
              </div>

              <div className="ao-block">
                <div className="muted">Status</div>
                <select className="ao-select" value={activeStatus} onChange={(e) => setActiveStatus(e.target.value)}>
                  {statusOptions.filter(Boolean).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="ao-block">
                <div className="muted">Schedule date/time</div>
                <input
                  className="ao-input"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>

              <div className="ao-block">
                <div className="muted">Admin note</div>
                <textarea className="ao-textarea" rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>

              <div className="ao-footer">
                <button className="ao-btn" onClick={saveActive}>Save</button>
                <button className="ao-btn ghost" onClick={() => setActive(null)}>Close</button>
              </div>

              <div className="ao-items">
                <div className="muted" style={{ marginBottom: 6 }}>Items</div>
                {(active.items || []).map((it, idx) => (
                  <div key={idx} className="ao-item">
                    <div className="strong">{it.name}</div>
                    <div className="muted">x{it.qty}</div>
                    <div className="muted">{Math.round(it.lineTotal || 0).toLocaleString("uk-UA")} грн</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
