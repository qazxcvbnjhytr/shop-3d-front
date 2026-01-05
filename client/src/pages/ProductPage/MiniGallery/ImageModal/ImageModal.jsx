import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import "./ImageModal.css";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export default function ImageModal({
  open,
  images = [],
  startIndex = 0,
  title,
  alt,
  onClose,
  onApply,
}) {
  const total = Array.isArray(images) ? images.length : 0;
  const hasMany = total > 1;

  const [index, setIndex] = useState(0);

  // animation states
  const [mounted, setMounted] = useState(false); // для анімації закриття
  const [imgVisible, setImgVisible] = useState(true); // для crossfade

  // zoom / pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!open) return;
    setMounted(true);
    setIndex(startIndex || 0);

    // reset zoom each open
    setZoom(1);
    setPan({ x: 0, y: 0 });

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, startIndex]);

  // unmount after close animation
  useEffect(() => {
    if (open) return;
    if (!mounted) return;
    const t = setTimeout(() => setMounted(false), 180);
    return () => clearTimeout(t);
  }, [open, mounted]);

  const src = useMemo(() => images?.[index] || "/placeholder.png", [images, index]);

  const close = useCallback(() => {
    onApply?.(index);
    onClose?.();
  }, [index, onApply, onClose]);

  const prev = useCallback(() => {
    if (!hasMany) return;
    setImgVisible(false);
    setTimeout(() => {
      setIndex((i) => (i - 1 + total) % total);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setImgVisible(true);
    }, 90);
  }, [hasMany, total]);

  const next = useCallback(() => {
    if (!hasMany) return;
    setImgVisible(false);
    setTimeout(() => {
      setIndex((i) => (i + 1) % total);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setImgVisible(true);
    }, 90);
  }, [hasMany, total]);

  // keyboard
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (hasMany && e.key === "ArrowLeft") prev();
      if (hasMany && e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close, hasMany, prev, next]);

  // zoom (double click)
  const toggleZoom = () => {
    setZoom((z) => {
      const nextZ = z > 1 ? 1 : 2;
      if (nextZ === 1) setPan({ x: 0, y: 0 });
      return nextZ;
    });
  };

  // wheel zoom
  const onWheel = (e) => {
    e.preventDefault();
    setZoom((z) => clamp(z + (e.deltaY > 0 ? -0.15 : 0.15), 1, 4));
  };

  // drag when zoomed
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

  if (!mounted) return null;

  return createPortal(
    <div className={`viewer ${open ? "is-open" : "is-closing"}`} role="dialog" aria-modal="true">
      {/* BACKDROP: клік закриває */}
      <button className="viewer__backdrop" type="button" aria-label="Close" onClick={close} />

      {/* TOP */}
      <div className="viewer__top" onClick={(e) => e.stopPropagation()}>
        <div className="viewer__title" title={title || ""}>
          {title || ""}
        </div>
        <button className="viewer__close" type="button" onClick={close} aria-label="Close">
          ✕
        </button>
      </div>

      {/* STAGE */}
      <div
        className={`viewer__stage ${zoom > 1 ? "is-zoomed" : ""}`}
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        {hasMany && (
          <button className="viewer__nav viewer__nav--left" type="button" onClick={prev} aria-label="Prev">
            ‹
          </button>
        )}

        <img
          className={`viewer__image ${imgVisible ? "is-visible" : ""}`}
          src={src}
          alt={alt || "Image"}
          draggable={false}
          onDoubleClick={toggleZoom}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          onError={(e) => (e.currentTarget.src = "/placeholder.png")}
        />

        {hasMany && (
          <button className="viewer__nav viewer__nav--right" type="button" onClick={next} aria-label="Next">
            ›
          </button>
        )}
      </div>

      {/* THUMBS */}
      {hasMany && (
        <div className="viewer__thumbs" onClick={(e) => e.stopPropagation()}>
          <div className="viewer__thumbsTrack">
            {images.map((u, i) => (
              <button
                key={`${i}-${u}`}
                type="button"
                className={`viewer__thumb ${i === index ? "is-active" : ""}`}
                onClick={() => {
                  if (i === index) return;
                  setImgVisible(false);
                  setTimeout(() => {
                    setIndex(i);
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                    setImgVisible(true);
                  }, 90);
                }}
                aria-label={`Open image ${i + 1}`}
              >
                <img src={u} alt="" />
              </button>
            ))}
          </div>
        </div>
      )}

    
    </div>,
    document.body
  );
}
