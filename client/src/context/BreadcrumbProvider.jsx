// client/src/context/BreadcrumbProvider.jsx
import React, { useState } from "react";
import BreadcrumbContext from "./BreadcrumbContext";

export function BreadcrumbProvider({ children }) {
  const [data, setData] = useState({
    categoryCode: null,
    productName: null,
    categoryMap: {},
  });

  return (
    <BreadcrumbContext.Provider value={{ data, setData }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}
