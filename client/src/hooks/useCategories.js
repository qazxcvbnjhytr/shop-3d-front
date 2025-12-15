// client/src/hooks/useCategories.js
import { useContext } from "react";
import { CategoryContext } from "../context/CategoryContext";

export const useCategories = () => useContext(CategoryContext);
