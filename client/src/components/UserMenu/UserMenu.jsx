import React, { useRef, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle, FaSignOutAlt, FaUser, FaUserShield } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import "./UserMenu.css";

const isTouchDevice = () => {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia?.("(hover: none), (pointer: coarse)");
  return mq ? mq.matches : false;
};

export default function UserMenu({ texts = {}, language = "ua", toggleLanguage }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const closeTimerRef = useRef(null);

  const touch = useMemo(() => isTouchDevice(), []);

  const isLoggedIn = !!user;
  const userName = user?.userName || user?.name || "";
  const userRole = user?.role || "user";
  const isAdmin = userRole === "admin";

  const accountLabel = texts.account || (language === "ua" ? "Мій кабінет" : "Account");
  const adminPanelLabel = texts.adminPanel || (language === "ua" ? "Адмін-панель" : "Admin panel");
  const logoutLabel = texts.logout || (language === "ua" ? "Вийти" : "Logout");
  const loginLabel = texts.login || (language === "ua" ? "Увійти" : "Login");
  const guestLabel = texts.guest || (language === "ua" ? "Гість" : "Guest");

  const roleLabel =
    language === "ua"
      ? isAdmin
        ? "Адміністратор"
        : "Користувач"
      : isAdmin
      ? "Administrator"
      : "User";

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(
    (delay = 180) => {
      cancelClose();
      closeTimerRef.current = setTimeout(() => setOpen(false), delay);
    },
    [cancelClose]
  );

  useEffect(() => () => cancelClose(), [cancelClose]);

  // ✅ Close on outside click + Escape
  useEffect(() => {
    if (!open) return;

    const onDoc = (e) => {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(e.target)) setOpen(false);
    };

    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc, { passive: true });
    window.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="user-controls" ref={rootRef}>
      {/* Language switch */}
      <button className="lang-button" type="button" onClick={toggleLanguage} aria-label="Toggle language">
        {language === "ua" ? "EN" : "UA"}
      </button>

      {/* User menu */}
      <div
        className={`user-menu ${open ? "open" : ""}`}
        onMouseEnter={() => {
          if (touch) return;
          cancelClose();
          setOpen(true);
        }}
        onMouseLeave={() => {
          if (touch) return;
          scheduleClose(180);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <button
          type="button"
          className="user-trigger"
          title={isLoggedIn ? userName : guestLabel}
          aria-label={isLoggedIn ? "Account menu" : "Login"}
          onClick={() => setOpen((p) => !p)} // ✅ mobile-friendly
        >
          <FaUserCircle className="user-icon" />
        </button>

        <div className="user-dropdown" role="menu" aria-hidden={!open}>
          <div className="user-dd-head">
            <div className="user-dd-title">{isLoggedIn ? userName || accountLabel : guestLabel}</div>
            <div className="user-dd-sub">
              {isLoggedIn ? roleLabel : language === "ua" ? "Не авторизовано" : "Not authorized"}
            </div>
          </div>

          <div className="user-dd-list">
            {isLoggedIn ? (
              <>
                <Link className="user-dd-item" to="/account" onClick={() => setOpen(false)}>
                  <FaUser />
                  <span>{accountLabel}</span>
                </Link>

                {isAdmin && (
                  <Link className="user-dd-item" to="/admin" onClick={() => setOpen(false)}>
                    <FaUserShield />
                    <span>{adminPanelLabel}</span>
                  </Link>
                )}

                <div className="user-dd-divider" />

                <button
                  className="user-dd-item danger"
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                >
                  <FaSignOutAlt />
                  <span>{logoutLabel}</span>
                </button>
              </>
            ) : (
              <Link className="user-dd-item" to="/login" onClick={() => setOpen(false)}>
                <FaUser />
                <span>{loginLabel}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
