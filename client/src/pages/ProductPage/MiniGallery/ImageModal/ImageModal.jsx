import React, { useEffect, useRef, useState } from "react";
import "../MiniGallery.css";
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export default function ImageModal({
  open,
  src,
  alt,
  onClose,
  onPrev,
  onNext,
  hasMany,
  index = 0,
  total = 0,
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const draggingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!open) return;
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [open, src]);

  // lock scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // keys
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (hasMany && e.key === "ArrowLeft") onPrev?.();
      if (hasMany && e.key === "ArrowRight") onNext?.();
      if (e.key === "+" || e.key === "=") setZoom((z) => clamp(z + 0.2, 1, 4));
      if (e.key === "-" || e.key === "_") setZoom((z) => clamp(z - 0.2, 1, 4));
      if (e.key === "0") {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, onPrev, onNext, hasMany]);

  const onWheel = (e) => {
    e.preventDefault();
    setZoom((z) => clamp(z + (e.deltaY > 0 ? -0.15 : 0.15), 1, 4));
  };

  const onMouseDown = (e) => {
    if (zoom <= 1) return;
    draggingRef.current = true;
    lastRef.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastRef.current.x;
    const dy = e.clientY - lastRef.current.y;
    lastRef.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  };

  const stopDrag = () => {
    draggingRef.current = false;
  };

  const toggleZoom = () => {
    setZoom((z) => {
      const next = z > 1 ? 1 : 2;
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  if (!open) return null;

  return (
    <div
      className="img-modal img-modal--full"
      role="dialog"
      aria-modal="true"
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
    >
      <div className="img-modal__backdrop" onClick={onClose} />

      {/* TOP BAR (overlay) */}
      <div className="img-modal__topbar img-modal__topbar--full" onClick={(e) => e.stopPropagation()}>
        <div className="img-modal__counter">
          {total ? `${index + 1} / ${total}` : ""}
        </div>

        <div className="img-modal__tools">
          <button type="button" onClick={() => setZoom((z) => clamp(z - 0.2, 1, 4))} aria-label="Zoom out">
            −
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            aria-label="Reset"
          >
            Reset
          </button>
          <button type="button" onClick={() => setZoom((z) => clamp(z + 0.2, 1, 4))} aria-label="Zoom in">
            +
          </button>
        </div>

        <button className="img-modal__close" type="button" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      {/* ARROWS (outside) */}
      {hasMany && (
        <>
          <button
            className="img-modal__nav img-modal__nav--prev"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev?.();
            }}
            aria-label="Prev"
          >
            ‹
          </button>
          <button
            className="img-modal__nav img-modal__nav--next"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext?.();
            }}
            aria-label="Next"
          >
            ›
          </button>
        </>
      )}

      {/* FULL SCREEN STAGE */}
      <div
        className={`img-modal__stage img-modal__stage--full ${zoom > 1 ? "is-zoomed" : ""}`}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onDoubleClick={toggleZoom}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          className="img-modal__img img-modal__img--full"
          src={src}
          alt={alt || "Image"}
          draggable={false}
          onError={(e) => (e.currentTarget.src = "/placeholder.png")}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        />
      </div>

      <div className="img-modal__hint img-modal__hint--full">
        Wheel — zoom, drag — move (when zoomed), double click — toggle zoom, ESC — close
      </div>
    </div>
  );
}
