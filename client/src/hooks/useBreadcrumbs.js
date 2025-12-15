import { useContext } from "react";
import BreadcrumbContext from "../context/BreadcrumbContext";

export function useBreadcrumbs() {
  const context = useContext(BreadcrumbContext);

  if (!context) {
    throw new Error("useBreadcrumbs must be used inside BreadcrumbProvider");
  }

  return context;
}
