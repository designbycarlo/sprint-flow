"use client";

import { useEffect } from "react";

type Props = {
  status?: string;
  error?: string;
  message?: string;
};

export function LoginAlertHandler({ status, error, message }: Props) {
  useEffect(() => {
    if (status === "success") {
      window.alert(message || "Success!");
    } else if (status === "failed") {
      window.alert("Login failed: " + (error || "Please try again."));
    } else if (status === "similar") {
      window.alert(error || "This looks similar to an existing account.");
    }
  }, [status, error, message]);

  if (status === "success" && message) {
    return (
      <div
        style={{
          color: "#2f855a",
          marginBottom: "20px",
          textAlign: "center",
          fontSize: "0.875rem",
          background: "rgba(47, 133, 90, 0.05)",
          padding: "10px 16px",
          borderRadius: "10px",
          border: "1px solid rgba(47, 133, 90, 0.15)",
        }}
      >
        {message}
      </div>
    );
  }

  if ((status === "failed" || status === "similar") && error) {
    return (
      <div
        style={{
          color: "#e53e3e",
          marginBottom: "20px",
          textAlign: "center",
          fontSize: "0.875rem",
          background: "rgba(229, 62, 62, 0.05)",
          padding: "10px 16px",
          borderRadius: "10px",
          border: "1px solid rgba(229, 62, 62, 0.15)",
        }}
      >
        {error}
      </div>
    );
  }

  return null;
}
