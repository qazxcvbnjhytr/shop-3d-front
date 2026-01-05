// client/src/admin/components/DataTable.jsx
import React from "react";

export default function DataTable({ columns, rows, emptyText = "No data", rowKey = "_id" }) {
  return (
    <div className="card">
      <div className="card-body" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key || c.header}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!rows?.length ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 14, opacity: 0.7 }}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={typeof rowKey === "function" ? rowKey(r) : r?.[rowKey]}>
                  {columns.map((c) => (
                    <td key={c.key || c.header}>
                      {typeof c.render === "function" ? c.render(r) : r?.[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
