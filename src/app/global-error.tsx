"use client";

import { useEffect } from "react";

import { reportError } from "@/lib/monitoring";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { boundary: "global", digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100dvh",
          margin: 0,
          background: "#0e1113",
          color: "#e8ecee",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>
            Something went wrong
          </h2>
          <p style={{ marginTop: "0.5rem", color: "#9ba4ac", fontSize: "0.875rem" }}>
            An unexpected error occurred.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: "1.25rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#f2b526",
              color: "#1a1303",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
