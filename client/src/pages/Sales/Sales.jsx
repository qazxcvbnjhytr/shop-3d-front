// client/src/pages/Sales/Sales.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance.js";
import DiscountBadge from "../../components/DiscountBadge/DiscountBadge.jsx";
import { useCart } from "../../context/CartContext.jsx";
import "./Sales.css";

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const pickText = (val, lang = "ua") => {
  if (val == null) return "";
  if (typeof val === "string" || typeof val === "number") return String(val);
  if (typeof val === "object") return String(val?.[lang] ?? val?.ua ?? val?.en ?? "");
  return "";
};

const safeImg = (src) => {
  if (!src) return "/placeholder.png";
  if (/^(https?:\/\/|data:|blob:)/i.test(src)) return src;
  if (src.startsWith("/")) return src;
  return `/${src}`;
};

function normalizeProduct(p) {
  const id = String(p?._id || p?.id || "");
  const nameUA = pickText(p?.name, "ua");
  const nameEN = pickText(p?.name, "en");

  const image = safeImg(
    p?.image ||
      p?.mainImage ||
      (Array.isArray(p?.images) ? p.images[0] : null) ||
      p?.productImage
  );

  // --- ЛОГІКА ЗНИЖКИ ---
  const discountPct = Math.max(0, Math.min(100, Number(toNum(p?.discountPct) ?? toNum(p?.discount) ?? 0)));

  const oldPrice = toNum(p?.oldPrice) ?? toNum(p?.price) ?? null;
  
  // Якщо є finalPrice, беремо його, інакше рахуємо від знижки
  let finalPrice = toNum(p?.finalPrice) ?? toNum(p?.newPrice);
  
  if (finalPrice == null && oldPrice != null && discountPct > 0) {
    finalPrice = Math.round(oldPrice * (1 - discountPct / 100));
  }
  // Якщо final все ще null, значить це просто price
  if (finalPrice == null) finalPrice = oldPrice;

  // Вираховуємо знижку, якщо вона не задана явно
  const computedPct =
    oldPrice != null && finalPrice != null && oldPrice > finalPrice
      ? Math.round(((oldPrice - finalPrice) / oldPrice) * 100)
      : 0;

  const realPct = discountPct > 0 ? discountPct : computedPct;

  const save = oldPrice != null && finalPrice != null && oldPrice > finalPrice
    ? Math.round(oldPrice - finalPrice)
    : 0;

  // --- ЛОГІКА НАЯВНОСТІ ---
  // Якщо quantity === 0, то точно немає.
  // Якщо quantity не вказано (null), дивимось на inStock.
  let isAvailable = p?.inStock !== false; 
  if (typeof p?.quantity === 'number' && p.quantity <= 0) {
    isAvailable = false;
  }

  const category = String(p?.category || "");
  const href = `/catalog/${encodeURIComponent(category)}/${encodeURIComponent(id)}`;

  return {
    raw: p,
    _id: id,
    name: nameUA || nameEN || "Товар",
    image,
    category,
    discountPct: realPct,
    oldPrice: oldPrice ?? 0,
    finalPrice: finalPrice ?? 0,
    save,
    inStock: isAvailable,
    sku: String(p?.sku || "").trim(),
    href,
  };
}

const formatUAH = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return `${Math.round(v).toLocaleString("uk-UA")} грн`;
};

export default function Sales() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  
  // Filters
  const [q, setQ] = useState("");
  const [minDiscount, setMinDiscount] = useState(10);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sort, setSort] = useState("discount_desc");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/products", { params: { discounted: 1, limit: 200 } });
        const list = Array.isArray(res.data?.items) ? res.data.items : (Array.isArray(res.data) ? res.data : []);
        setItems(list.map(normalizeProduct));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = items.filter((p) => p.discountPct > 0 && p.save > 0);
    
    // Фільтри
    if (minDiscount > 0) list = list.filter((p) => p.discountPct >= minDiscount);
    if (onlyInStock) list = list.filter((p) => p.inStock);
    if (q) {
      const qq = q.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(qq) || p.sku.toLowerCase().includes(qq));
    }

    // Сортування
    return list.sort((a, b) => {
      if (sort === "discount_desc") return b.discountPct - a.discountPct;
      if (sort === "save_desc") return b.save - a.save;
      if (sort === "price_asc") return a.finalPrice - b.finalPrice;
      if (sort === "price_desc") return b.finalPrice - a.finalPrice;
      return 0;
    });
  }, [items, q, minDiscount, onlyInStock, sort]);

  const addToCart = (p) => {
    if (!p.inStock) return;
    if (addItem) {
      addItem({
        productId: p._id,
        name: p.name,
        sku: p.sku,
        qty: 1,
        oldPrice: p.oldPrice,
        finalPrice: p.finalPrice,
        discountPct: p.discountPct,
        imageSrc: p.image,
        href: p.href,
      });
    }
  };

  return (
    <div className="sales-page">
      <div className="sales-hero">
        <div className="hero-inner">
          <div className="hero-content">
            <span className="hero-badge">SALE</span>
            <h1 className="hero-title">Гарячі знижки</h1>
            <p className="hero-desc">Тільки найкращі пропозиції. Встигни придбати, поки товар є в наявності.</p>
          </div>
          
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-val">{filtered.length}</div>
              <div className="stat-lbl">товарів</div>
            </div>
            <div className="stat-item">
              <div className="stat-val">-{items.length ? Math.max(...items.map(i=>i.discountPct)) : 0}%</div>
              <div className="stat-lbl">макс. знижка</div>
            </div>
          </div>
        </div>
      </div>

      <div className="sales-container">
        {/* Панель фільтрів */}
        <div className="sales-toolbar">
          <div className="filter-group">
            <input 
              value={q} 
              onChange={e => setQ(e.target.value)} 
              placeholder="Пошук..." 
              className="elite-input"
            />
            <select value={sort} onChange={e => setSort(e.target.value)} className="elite-select">
              <option value="discount_desc">Макс. знижка</option>
              <option value="save_desc">Макс. економія</option>
              <option value="price_asc">Дешевші</option>
              <option value="price_desc">Дорожчі</option>
            </select>
             <select value={minDiscount} onChange={e => setMinDiscount(Number(e.target.value))} className="elite-select">
              <option value={0}>Всі знижки</option>
              <option value={20}>20%+</option>
              <option value={50}>50%+</option>
            </select>
          </div>
          
          <div className="filter-check">
            <label>
              <input type="checkbox" checked={onlyInStock} onChange={e => setOnlyInStock(e.target.checked)} />
              <span>Тільки в наявності</span>
            </label>
          </div>
        </div>

        {/* Сітка товарів */}
        {loading ? (
          <div className="loading-state">Завантаження пропозицій...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">Товарів за вашим запитом не знайдено.</div>
        ) : (
          <div className="sales-grid">
            {filtered.map((p) => (
              <div key={p._id} className={`sale-card ${!p.inStock ? "is-oos" : ""}`}>
                <div className="card-media">
                  <Link to={p.href} className="media-link">
                    <img src={p.image} alt={p.name} loading="lazy" />
                  </Link>
                  
                  {/* Бейджі: Абсолютне позиціонування */}
                  <div className="badges-layer">
                    <div className="badge-left">
                       <DiscountBadge discount={p.discountPct} />
                    </div>
                    <div className="badge-right">
                      {p.inStock ? (
                        <span className="status-dot available" title="В наявності" />
                      ) : (
                        <span className="status-dot missing" title="Закінчився" />
                      )}
                    </div>
                  </div>

                  {/* Якщо немає в наявності — показуємо оверлей */}
                  {!p.inStock && (
                    <div className="oos-overlay">
                      <span>SOLD OUT</span>
                    </div>
                  )}
                </div>

                <div className="card-info">
                  <div className="card-meta">
                    <span className="meta-sku">{p.sku ? `SKU: ${p.sku}` : "Sale"}</span>
                    {p.category && <span className="meta-cat">{p.category}</span>}
                  </div>

                  <Link to={p.href} className="card-title" title={p.name}>
                    {p.name}
                  </Link>

                  <div className="card-price-block">
                    <div className="price-row">
                      <span className="price-curr">{formatUAH(p.finalPrice)}</span>
                      <span className="price-prev">{formatUAH(p.oldPrice)}</span>
                    </div>
                    <div className="price-save">
                      Економія {formatUAH(p.save)}
                    </div>
                  </div>

                  <button 
                    className="card-btn" 
                    onClick={() => addToCart(p)} 
                    disabled={!p.inStock}
                  >
                    {p.inStock ? "Додати в кошик" : "Немає в наявності"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}