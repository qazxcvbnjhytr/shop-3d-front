import React from "react";
import { Link } from "react-router-dom";
import "./CollectionCard.css";

export default function CollectionCard({ collectionKey, count, label, image }) {
  const name = label || collectionKey;
  
  return (
    <Link to={`/collections/${encodeURIComponent(collectionKey)}`} className="cc-card">
      <div className="cc-media">
        {image ? (
          <img src={image} alt={name} loading="lazy" onError={(e) => e.currentTarget.style.display = 'none'} />
        ) : (
          <div className="cc-placeholder">No Photo</div>
        )}
        <div className="cc-overlay" />
      </div>
      
      <div className="cc-content">
        <span className="cc-badge">{count} товарів</span>
        <h3 className="cc-title">{name}</h3>
        <span className="cc-link">Дивитись колекцію &rarr;</span>
      </div>
    </Link>
  );
}