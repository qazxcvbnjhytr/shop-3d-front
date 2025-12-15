import React, { useState } from "react";
import HeaderTop from "./HeaderTop/HeaderTop";
import HeaderNav from "./HeaderNav/HeaderNav";
import "./Header.css";
export default function Header({ title = "MebliHub" }) {
  const [menuActive, setMenuActive] = useState(false);

  return (
    <header className="header-wrap">
      <HeaderTop title={title} />
      <HeaderNav menuActive={menuActive} setMenuActive={setMenuActive} />
    </header>
  );
}
