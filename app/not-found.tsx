// Safety net only: app/[locale]/not-found.tsx handles every normal 404 (any
// path under a matched locale). This root-level file only renders for a
// request that doesn't match the [locale] segment at all — vanishingly rare
// given the proxy.ts matcher, but the root app/layout.tsx doesn't render its
// own <html>/<body> (that lives in app/[locale]/layout.tsx), so this needs
// to be a fully self-contained document rather than assume that shell exists.
export default function RootNotFound() {
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
        <p style={{ fontSize: 64, fontWeight: 300, margin: 0, color: "rgba(201,169,110,0.4)" }}>
          404
        </p>
        <p style={{ marginTop: 16, fontSize: 24, fontWeight: 300 }}>Lost in transit.</p>
        <a
          href="/"
          style={{
            marginTop: 32,
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
      </body>
    </html>
  );
}
