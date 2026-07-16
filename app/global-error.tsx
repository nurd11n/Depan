"use client";

import { useEffect } from "react";

// Catches errors thrown in the root layout itself (very rare — normal page
// errors are caught by app/[locale]/error.tsx instead). Must render its own
// <html>/<body> since it replaces the whole root layout, and can't safely
// assume next-intl's locale context is available, so this stays plain
// English with inline styles rather than depending on globals.css/Tailwind.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error boundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#181818",
          color: "#f0ede8",
          fontFamily: "Georgia, serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <p style={{ fontSize: 32, fontWeight: 300, margin: 0 }}>Something went wrong.</p>
        <p style={{ marginTop: 16, color: "#8a8480", fontSize: 14, maxWidth: 420 }}>
          An unexpected error occurred. Please try again, or head back to the homepage.
        </p>
        <div style={{ marginTop: 32, display: "flex", gap: 16 }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "none",
              border: "1px solid #c9a96e",
              color: "#c9a96e",
              padding: "13px 36px",
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
          <a
            href="/"
            style={{
              background: "#c9a96e",
              color: "#181818",
              padding: "13px 36px",
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            Back to Home
          </a>
        </div>
      </body>
    </html>
  );
}
