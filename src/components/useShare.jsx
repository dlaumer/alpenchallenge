// src/hooks/useShare.js
import { useState } from "react";

export function useShare() {
  const [toast, setToast] = useState("");

  function share(all = true) {
    try {
      if (all) {
        navigator.clipboard.writeText(window.location.href);
      }
      else {
        // copy only origin + pathname (no ?… parameters)
        const base = window.location.origin + window.location.pathname;
        navigator.clipboard.writeText(base);
      }
      setToast("Link copied to clipboard!");
    } catch (e) {
      setToast("Failed to copy link");
    }
    setTimeout(() => setToast(""), 2000);
  }

  const Toast = toast ? (
    <div style={{
      position: "absolute",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#333",
      color: "#fff",
      padding: "10px 20px",
      borderRadius: "6px",
      zIndex: 10000,
      fontSize: "14px"
    }}>
      {toast}
    </div>
  ) : null;

  return { share, Toast };
}
