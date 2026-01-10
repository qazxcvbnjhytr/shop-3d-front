import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { createClientOrdersApi } from "../../api/ordersApi.js";

export default function MyOrders() {
  const { user, loading } = useAuth();
  const token = user?.token || localStorage.getItem("token") || "";
  const api = useMemo(() => createClientOrdersApi(() => token), [token]);

  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!token) return;

    (async () => {
      setBusy(true);
      setErr("");
      try {
        const data = await api.myList();
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e?.response?.data?.message || e?.message || "Error");
      } finally {
        setBusy(false);
      }
    })();
  }, [api, token, loading]);

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (!token) return <div style={{ padding: 16 }}>Увійдіть, щоб бачити замовлення.</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ margin: "0 0 12px" }}>Мої замовлення</h2>

      {err && <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div>}
      {busy && <div>Завантаження...</div>}

      {!busy && items.length === 0 && <div>Поки що замовлень немає.</div>}

      {items.map((o) => (
        <div key={o._id} style={{ border: "1px solid rgba(0,0,0,.12)", borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div><b>№</b> {o._id}</div>
            <div><b>Статус:</b> {o.status}</div>
            <div><b>Разом:</b> {Math.round(o?.pricing?.total || 0).toLocaleString("uk-UA")} грн</div>
            <div><b>Дата:</b> {new Date(o.createdAt).toLocaleString("uk-UA")}</div>
          </div>

          <div style={{ marginTop: 10, opacity: 0.9 }}>
            {o.items?.slice(0, 3)?.map((it, idx) => (
              <div key={idx}>{it.name} × {it.qty}</div>
            ))}
            {o.items?.length > 3 && <div>…ще {o.items.length - 3}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
