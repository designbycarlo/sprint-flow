"use client";

import { signout } from "@/app/login/actions";
import { clearClientCache } from "@/utils/clearClientCache";

export function LogOutButton() {
  const handleClick = () => {
    void clearClientCache();
  };

  return (
    <form action={signout}>
      <button
        onClick={handleClick}
        style={{
          background: "transparent",
          color: "var(--btn-text, #333)",
          border: "var(--btn-border, 1px solid #ccc)",
          padding: "8px 16px",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "13px",
          transition: "all 0.2s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.opacity = "0.8";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
      >
        Log Out
      </button>
    </form>
  );
}
