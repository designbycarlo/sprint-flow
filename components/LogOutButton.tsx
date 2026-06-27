"use client";

import { signout } from "@/app/login/actions";

export function LogOutButton() {
  return (
    <form action={signout}>
      <button
        style={{
          background: "var(--btn-bg, white)",
          color: "var(--btn-text, #333)",
          border: "var(--btn-border, 1px solid #ccc)",
          padding: "8px 16px",
          borderRadius: "8px",
          cursor: "pointer",
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
