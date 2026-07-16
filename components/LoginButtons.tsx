"use client";

import { login, signup } from "@/app/login/actions";
import { clearClientCache } from "@/utils/clearClientCache";

export function LoginButtons() {
  const handleClick = () => {
    void clearClientCache();
  };

  return (
    <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
      <button formAction={login} onClick={handleClick} className="login-btn-primary">
        Log In
      </button>
      <button formAction={signup} onClick={handleClick} className="login-btn-secondary">
        Sign Up
      </button>
    </div>
  );
}
