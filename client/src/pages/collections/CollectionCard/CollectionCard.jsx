import React from "react";
import { Link } from "react-router-dom";
import "./CollectionCard.css";

const safe = (v) => String(v ?? "").trim();

export default function CollectionCard({ collectionKey, count = 0, label, image }) {
  const key = safe(collectionKey);
  const name = safe(label) || key;

  return (
    <Link
      to={`/collections/${encodeURIComponent(key)}`}
      className="col-card"
      aria-label={`Відкрити колекцію ${name}`}
    >
      <div className="col-card__media">
        {image ? (
          <img
            className="col-card__img"
            src={image}
            alt={name}
            loading="lazy"
            onError={(e) => (e.currentTarget.src = "/placeholder.png")}
          />
        ) : (
          <div className="col-card__ph">
            <div className="col-card__phBadge">COLLECTION</div>
          </div>
        )}
      </div>

      <div className="col-card__body">
        <div className="col-card__row">
          <div className="col-card__name" title={name}>
            {name}
          </div>
          <div className="col-card__count">{Number(count) || 0}</div>
        </div>

        <div className="col-card__hint">Відкрити підбірку →</div>
      </div>
    </Link>
  );
}
