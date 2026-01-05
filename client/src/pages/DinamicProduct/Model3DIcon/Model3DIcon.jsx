import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { IoCubeOutline } from "react-icons/io5";
import "./Model3DIcon.css";

export default function Model3DIcon({
  item,
  to,             // куди вести (наприклад detailsLink)
  lang = "ua",
  className = "",
  asLink = true,  // якщо false — буде просто badge без кліку
}) {
  const has3D = useMemo(() => {
    if (!item) return false;

    // ✅ підтримує різні назви полів (залиш так, або під свою БД)
    return Boolean(
      item?.hasModel ||
      item?.modelUrl ||
      item?.model ||
      item?.modelFile ||
      item?.modelPath ||
      item?.model3d ||
      item?.model3D ||
      item?.glb ||
      item?.gltf
    );
  }, [item]);

  if (!has3D) return null;

  const title = lang === "ua" ? "Є 3D модель" : "3D model available";

  const content = (
    <>
      <IoCubeOutline size={18} />
      <span className="model3d-badge__text">3D</span>
    </>
  );

  if (asLink && to) {
    return (
      <Link
        to={to}
        className={`model3d-badge ${className}`}
        title={title}
        aria-label={title}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={`model3d-badge ${className}`} title={title} aria-label={title}>
      {content}
    </div>
  );
}
