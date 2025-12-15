// src/pages/Home.jsx
import React from "react";
import ThreeDViewer from "../components/ThreeDViewer";

export default function Home({ viewerRef }) {
  return (
    <div style={{ marginTop: "20px" }}>
      <ThreeDViewer ref={viewerRef} />
    </div>
  );
}
