import React from "react";

export default function PageHeader({ title, subtitle, right }) {
  return (
    <div className="adm-card">
      <div className="adm-row">
        <div>
          <h2 style={{ margin: 0 }}>{title}</h2>
          {subtitle ? <div className="adm-muted" style={{ marginTop: 6 }}>{subtitle}</div> : null}
        </div>
        <div className="adm-actions">{right}</div>
      </div>
    </div>
  );
}
