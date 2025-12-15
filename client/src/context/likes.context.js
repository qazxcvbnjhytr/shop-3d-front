import { createContext, useContext } from "react";

export const LikesContext = createContext({
  likedProducts: [],
  likedProductIds: [],
  toggleLike: () => {},
  isLiked: () => false,
  isLoading: false,
});

export const useLikes = () => useContext(LikesContext);
