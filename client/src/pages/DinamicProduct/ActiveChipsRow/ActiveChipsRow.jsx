import React from "react";
import "./ActiveChipsRow.css";

export default function ActiveChipsRow({
  chips = [],
  onReset,
  onRemove,
  resetText = "Скинути всі",
}) {
  if (!chips.length) return null;

  return (
    <div className="sc-chips-row">
      <button className="sc-chip sc-chip--reset" onClick={onReset}>
        {resetText} <span className="sc-chip-x">×</span>
      </button>

      {chips.map((chip, idx) => (
        <button
          key={`${chip.field}:${chip.val}:${idx}`}
          className="sc-chip"
          onClick={() => onRemove(chip.field, chip.val)}
        >
          {chip.label} <span className="sc-chip-x">×</span>
        </button>
      ))}
    </div>
  );
}
