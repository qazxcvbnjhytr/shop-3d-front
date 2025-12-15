// client/src/pages/account/AccountPage/AccountLayout.jsx
import React from "react";
import s from "./AccountLayout.module.css";

export default function AccountLayout({ loading, error, message, children }) {
  if (loading) {
    return (
      <div className={s.container}>
        <p className={s.loading}>Loading your account...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={s.container}>
        <p className={s.error}>Error: {error}</p>
      </div>
    );
  }

  if (message) {
    return (
      <div className={s.container}>
        <p className={s.message}>{message}</p>
      </div>
    );
  }

  return <div className={s.container}>{children}</div>;
}
