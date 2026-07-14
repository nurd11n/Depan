import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Minimal, self-contained server bundle for the Docker image — copies only
  // the traced production dependencies instead of all of node_modules.
  output: "standalone",
  // The warehouse-address CSV path is read from an env var, so Next's file
  // tracer can't statically rule it out and will otherwise copy whatever
  // currently sits in ./data (real customer PII on a real deploy box) into
  // the build output. .dockerignore already keeps it out of the Docker
  // image; this closes the same gap for a plain local `next build`.
  outputFileTracingExcludes: {
    "**/*": ["./data/**"],
  },
};

export default withNextIntl(nextConfig);
