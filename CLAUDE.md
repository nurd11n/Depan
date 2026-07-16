# CLAUDE.md — DAPAN GLOBAL LLC

Cargo delivery (China → USA) + product sourcing site for DAPAN GLOBAL LLC (Chicago).
Bilingual EN/RU, public-facing. Three jobs: shipping-cost calculator, shipment tracking, lead capture.

## Why not one vanilla HTML file
The original brief asked for a single HTML/CSS/JS file. We're deliberately not doing that:
- Rates live in **two** places (calculator + rates table). Vanilla = copy-paste that drifts silently. One typed config fixes it.
- "Swap every string on toggle" via a giant JS object is unmaintainable. Real i18n gives typed dictionaries + per-locale URLs (SEO + shareable links).
- Quote forms should actually deliver leads (email), not fake a confirmation toast. That needs a backend.
- Tracking is HTTP-only and can't be iframed into an HTTPS site (mixed content). Needs a server-side proxy.

## Stack
- **Next.js (App Router) + TypeScript + Tailwind** — same as the Avangard project, reuse tooling.
- **next-intl** for i18n, locale-prefixed routes `/en` `/ru`.
- **react-hook-form + zod** for forms + validation.
- **Route Handlers** (`app/api/*`) for lead delivery + tracking proxy.
- **Docker + Caddy** for deploy (auto-HTTPS), same as Avangard.

## File layout
```
app/[locale]/page.tsx           # Home page (Hero + Services)
app/[locale]/shipping/page.tsx  # Calculator + Rates
app/[locale]/tracking/page.tsx  # tracking form  (tracking/[code] = results)
app/[locale]/warehouse/page.tsx # China warehouse address
app/[locale]/contact/page.tsx   # quote forms + contact channels
app/[locale]/[...catchAll]/page.tsx  # localized 404 for any dead link under a valid locale
app/[locale]/layout.tsx         # fonts, Navbar/Footer, theme init, metadata template
app/[locale]/not-found.tsx      # narrow-edge-case fallback only — see "Error/404/loading pages" below
app/[locale]/error.tsx          # client-side runtime error boundary
app/[locale]/loading.tsx        # Suspense fallback (spinner, no copy — see below)
app/not-found.tsx               # root safety net, self-contained (no [locale] shell to inherit)
app/global-error.tsx            # catches errors in the root layout itself, self-contained
app/api/quote/route.ts          # cargo + sourcing lead intake
app/api/track/route.ts          # tracking proxy
app/api/warehouse-address/route.ts  # China warehouse address assignment
app/api/warehouse-report/route.ts   # token-gated CSV download (ADMIN_EXPORT_TOKEN)
components/                     # Navbar Footer ThemeToggle SectionHeading NotFoundContent Hero Services Calculator Tracking RatesTable WarehouseAddress QuoteCargo QuoteSourcing
lib/rates.ts                    # SINGLE SOURCE OF TRUTH for all pricing
lib/calc.ts                     # pure chargeable-weight + cost function
lib/csvStore.ts                 # warehouse address CSV storage + dedupe + numbering
lib/dailyReport.ts              # schedules the daily CSV report email
lib/mailer.ts                   # Gmail SMTP (Nodemailer) — quote leads + daily CSV report only.
                                 # No per-customer warehouse-address email — deliberate, see that section.
lib/site.ts                     # SITE_URL + contact/social constants (single source)
lib/pageMeta.ts                 # per-page localized metadata builder
messages/{en,ru,es,uk}.json     # all UI copy (identical key sets, 4 locales)
```

## Domain logic — `lib/rates.ts` (single source of truth)
Both the calculator AND the rates table import from here. Never hardcode a price in a component.

Sea freight — price/kg by weight tier (USD):
- Standard General: 12kg+ 4.50 / 51kg+ 4.13 / 100kg+ 3.75  — transit 20–25d
- Standard Sensitive: 5.38 / 4.88 / 4.38
- Fast General: 4.88 / 4.50 / 4.13  — transit 14–18d
- Fast Sensitive: 5.75 / 5.38 / 4.88

Air freight — transit 5–9d:
- 5–10kg billed per 0.5kg: General first 0.5 = 22.50, each extra 0.5 = 8.13; Sensitive 25.00 / 8.75
- 10–20kg: General 14.13/kg, Sensitive 14.88/kg
- 20kg+: General 13.63/kg, Sensitive 14.63/kg
- Surcharge +0.38/kg: essential oils, aromatherapy, candles, perfume, medicine, supplements, F-goods

Shared rules:
- Volumetric weight = (L × W × H cm) / 6000
- Chargeable = max(actual, volumetric), rounded UP to next full kg
- Sea minimum billable = 12kg
- Remote zip: +$15 flat per piece
- Claims text (display only): freight refund + $2.50/kg; after UPS/FedEx pickup max $100/piece

## `lib/calc.ts`
Pure function `estimate(input) → { chargeableKg, cost, transitDays }`. No DOM, no i18n — unit-testable.
Calculator component calls it on every input change (debounced). Output shows: cost, chargeable weight,
transit window, and the "final price confirmed after warehouse measurement" note.

## i18n
- Four locales: **en, ru, es, uk** — the list lives in `i18n/routing.ts`; everything else (static
  generation, sitemap, hreflang, nav language switcher, the warehouse-email guide) derives from it, so
  adding a locale = add it there + a `messages/<locale>.json` with the same key set. Nothing hardcodes
  the locale count. Every string keyed identically across all four files.
- Language switcher (EN|RU|ES|UK, navbar + burger) flips the URL prefix on the current path.
- Zero hardcoded copy in components.

## Pages (multi-page, grouped) + navigation
Header (fixed) with page links + active-state highlight, language switcher, and light/dark theme
toggle; collapses to a burger menu below `lg`. Pages:
- **Home** `/[locale]` — Hero (CTAs link to /shipping and /contact) + Services cards.
- **Shipping** `/[locale]/shipping` — Calculator + Rates table.
- **Tracking** `/[locale]/tracking` — tracking form; `/tracking/[code]` renders results.
- **Warehouse** `/[locale]/warehouse` — China warehouse address feature.
- **Contact** `/[locale]/contact` — contact channels + cargo & sourcing quote forms.
Every page is statically generated per locale and sets its own localized title/description +
canonical/hreflang via `lib/pageMeta.ts` (layout supplies the `%s — DAPAN GLOBAL` title template).

## Error / 404 / loading pages
- **`app/[locale]/[...catchAll]/page.tsx` is the real 404 page** — it's what actually renders for any
  dead link under a valid locale (e.g. `/en/typo`). It's a **normal page**, not the special
  `not-found.tsx` file, and that's deliberate:
  **`app/[locale]/not-found.tsx` cannot be used for this.** Verified live and repeatedly: Next.js
  renders that special file's output *once* (at build/first-compile) and reuses the cached HTML for
  every subsequent 404 regardless of the actual request's locale — `headers()`-based workarounds don't
  fix it, and `export const dynamic = "force-dynamic"` doesn't fix it either, it just forces the
  **entire `[locale]` segment** to stop being statically generated (a real regression — every other
  page went from `●` SSG to `ƒ` dynamic). `not-found.tsx` is kept only as the fallback for the one case
  the catch-all can't reach: a garbage locale segment (`/xx/shipping`) — in practice next-intl's
  middleware redirects that into the catch-all anyway (`/xx/shipping` → `/en/xx/shipping`), so
  not-found.tsx is rarely if ever actually hit. **Don't try to make it locale-aware again** — if you
  need to change the 404 page, edit `components/NotFoundContent.tsx` (shared by both).
  One trade-off of the catch-all approach: it returns HTTP 200, not a true 404 status.
- **`app/[locale]/error.tsx`** (client-side runtime error boundary) has no such issue — it correctly
  localizes in a real browser every time, because `useTranslations` there is the *client* hook reading
  from `NextIntlClientProvider` context already established by the layout, not a fresh per-request
  server resolution. Don't test it with `curl`/`fetch` though — the initial HTML response is the
  pre-hydration shell; the swap to error.tsx's content only happens after client JS hydrates and the
  error boundary catches it. Verify with a real browser (Playwright), not raw HTTP.
- **`app/not-found.tsx`** and **`app/global-error.tsx`** (root-level, outside `[locale]`) are
  self-contained documents with inline styles, not Tailwind/next-intl. Reason: `app/layout.tsx` doesn't
  render `<html>`/`<body>` itself (only `app/[locale]/layout.tsx` does, since it needs the locale for
  `lang=`), so anything rendered outside that segment has no shell to inherit and must supply its own.
- **`app/[locale]/loading.tsx`** is a plain spinner, no translations — it's a Suspense fallback shown
  very briefly, not worth the complexity of localizing.
- Gotcha unrelated to any of the above but discovered while building this: **folder/file names starting
  with `_` are Next.js "private folders" and are silently excluded from routing.** A test route named
  `__test-error` never matched anything and fell through to the catch-all — cost real debugging time.

## Theme (light + dark)
- Dark is the default; a header toggle switches to light and persists in `localStorage`. First visit
  uses the OS `prefers-color-scheme`. An inline script in the layout `<body>` sets `data-theme` before
  paint (no flash) — `themeInitScript` lives in `components/ThemeToggle.tsx`.
- Implemented purely with CSS variables in `app/globals.css`: `:root` = dark values, `:root[data-theme
  ="light"]` overrides them. The Tailwind tokens (`midnight`, `midnight-light`, `cream`, `muted`,
  `gold`, `border`) are semantic roles (bg / surface / primary text / secondary text / accent / border),
  so no component className changes between themes. **Don't use literal `white`/`black`/hex color
  utilities in components** — they won't adapt; use the tokens (e.g. `bg-cream/[0.04]` for a neutral
  hover that works in both themes).

## Tracking — `/api/track` proxy
Backend: `http://175.178.206.118:8082/trackIndex.htm` (HTTP, bare IP). Sample code: `JXTXL26060401`.
- Cannot iframe directly — HTTP content is blocked as mixed content on our HTTPS domain.
- Build step: open `trackIndex.htm`, submit a code, watch the Network tab to find the real endpoint it
  hits (likely a GET/POST returning HTML or JSON). Replicate that request server-side in `/api/track`.
- `/api/track?code=XXX` fetches server-side (no CORS, no mixed-content), returns parsed status; we render
  it natively in our own UI + active locale.
- Fallback if the endpoint can't be parsed: a "Open Tracking Page" button that opens the raw URL in a new tab.

## Forms — `/api/quote`
- Validate with zod. Honeypot field + simple rate-limit for spam.
- Deliver leads by **email** (Gmail SMTP via Nodemailer, `lib/mailer.ts`) to `LEADS_EMAIL` (falls back to
  `GMAIL_USER`) — real delivery, not a fake toast. This is the natural feed into the ACOCOS CRM later.
- Two schemas: cargo (name, contact, email, weight, cargo type, shipping pref, description) and
  sourcing (name, contact, email, product, target price/unit, quantity, notes).
- On success show the EN/RU confirmation ("We'll contact you within 24 hours").

## Warehouse address — `/api/warehouse-address`
- Assigns each customer a personal receiving address at the China warehouse: `ZWQ05-{N}`, sequential,
  never reused. Format lives in `lib/warehouseAddress.ts`.
- **Storage is a local CSV** (`lib/csvStore.ts`), not a database — one row per assignment
  (firstName, lastName, phone, email, code, fullAddress, createdAt). Path: `CSV_FILE_PATH` env
  (defaults to `./data/warehouse-addresses.csv`); point it at a mounted volume in production so it
  survives container restarts. `data/` is gitignored — it holds customer PII.
- **Dedupe**: before assigning, look up by email OR phone. If either already exists, re-send the
  same existing row and do NOT increment the counter.
- **Concurrency**: read-max-then-append is wrapped in an in-process async mutex (`withLock` in
  `csvStore.ts`) so two simultaneous submits can't grab the same number. This only guards a single
  Node process — fine since we deploy as one container, not distributed serverless.
- **No per-customer email** — the assigned address is only shown inline on the page (with a copy
  button), never emailed. Deliberate: this domain's outbound mail to external inboxes is unreliable
  (see `lib/mailer.ts`'s SMTP result logging), and since dedupe already returns the same address on
  repeat visits, the customer can always come back to `/warehouse` and re-fetch it. Don't reintroduce a
  `sendWarehouseAddressEmail`-style call here.
- **Daily report**: `lib/dailyReport.ts` schedules (via `instrumentation.ts`, registered once at
  server start) a send of the *entire* CSV as an email attachment once a day
  (`DAILY_REPORT_HOUR`/`DAILY_REPORT_MINUTE`, default 23:59 server time) to `LEADS_EMAIL` — this is
  the operational backup/record now that there's no Google Sheet to look at live.
- **On-demand download**: `GET /api/warehouse-report?token=<ADMIN_EXPORT_TOKEN>` streams the CSV so it
  can be pulled from a browser (the file lives in a Docker named volume, not on the host). Disabled
  unless `ADMIN_EXPORT_TOKEN` is set. Doubles as a health check: a 404 "No data yet" means no write has
  ever succeeded (→ check `docker compose logs app | grep csvStore` for an `EACCES` volume-perm error).

## Design tokens (Tailwind theme)
- Background `#0D1B2A` (midnight), accent `#E8A33D` (gold), text white.
- Fonts via next/font: Space Grotesk (headings), Inter (body).
- Real logistics brand feel, not a template. Fully responsive.

## Performance & caching
- **Home page (`/en`, `/en`) is fully static** — prerendered at build time (`generateStaticParams` in
  `app/[locale]/layout.tsx`), zero server work per request. Don't add `cookies()`/`headers()`/uncached
  `fetch()` to `page.tsx` or its section components — that would force it dynamic.
- **`/[locale]/tracking/[code]`** is necessarily dynamic (live upstream data), but sets
  `export const revalidate = 45` so a repeat hit on the same code within 45s serves the
  already-rendered page instead of re-fetching.
- **`lib/tracking.ts`**: the upstream needs a session cookie (GET) before the real query (POST) — the
  cookie is cached in-process for 8 min and reused across different tracking codes (cuts a lookup from
  2 upstream round-trips to 1), with one automatic re-auth-and-retry if the cached session turns out
  stale. Parsed results are also cached in-process per code for 60s; `/api/track` mirrors that with a
  `Cache-Control: public, max-age=45` response header.
- **`lib/csvStore.ts`**: the warehouse-address CSV is parsed once into memory and kept in sync on every
  `appendRow` — dedupe/numbering lookups never re-read the file from disk after the first request.
- **`lib/mailer.ts`**: the Nodemailer SMTP transporter is created once (pooled, `maxConnections: 3`) and
  reused, instead of re-authenticating with Gmail on every single send.
- CSV_PATH is read from an env var, so Next's file tracer can't statically rule it out and will try to
  bundle whatever's in `./data` into the build output. Every fs call site on `CSV_PATH` carries a
  `/* turbopackIgnore: true */` comment plus `outputFileTracingExcludes` in `next.config.ts` to stop
  that — don't remove them, or real customer PII from a local `data/` folder can end up in a build.

## Deploy
Multi-stage `Dockerfile` (deps → builder → runner, Next `output: "standalone"`, Node 22-alpine,
non-root user) + `docker-compose.yml` (app + Caddy) + `Caddyfile` (auto-HTTPS reverse proxy). Same
pattern as Avangard.
- `docker compose up -d --build` from the project root. Caddy listens on 80/443; the app is only
  reachable through it (`expose`, not `ports`).
- The warehouse-address CSV persists in the **`warehouse_data` named volume** mounted at `/app/data`
  (not a host bind-mount). Reason: the container runs as non-root `nextjs` (UID 1001); a host bind-mount
  would carry the host dir's root ownership and the app couldn't write to it — that's exactly the
  "warehouse address save fails on server but works locally" bug. A named volume initializes from the
  image's `/app/data` (owned by `nextjs:nodejs`), so writes succeed. `docker-compose.yml` sets
  `CSV_FILE_PATH=/app/data/warehouse-addresses.csv` via `environment:` (overrides `env_file`). Read/back
  up the CSV with `docker compose cp app:/app/data/warehouse-addresses.csv ./out.csv` (the daily email
  report also carries it). If the warehouse form ever 502s, `docker compose logs app | grep csvStore`
  now prints the real underlying fs error.
- **Domain: `dapanglobal.com`.** Hardcoded as the default in `Caddyfile` (`{$DOMAIN:dapanglobal.com}`)
  and `docker-compose.yml` (`DOMAIN=${DOMAIN:-dapanglobal.com}`) — both need to agree, since Compose's
  own default takes effect before Caddy's fallback ever gets a chance to. To point at something else
  (e.g. `localhost` for a local Compose smoke test), set `DOMAIN=...` in a plain `.env` file next to
  `docker-compose.yml` (Compose's own variable substitution reads `.env`, not `.env.local` — a separate
  mechanism from the app's runtime secrets).
- The same domain is the single source of truth `lib/site.ts` (`SITE_URL`), imported by
  `app/[locale]/layout.tsx` (metadataBase, canonical/hreflang alternates, Open Graph), `app/robots.ts`,
  and `app/sitemap.ts`. Never hardcode the domain string a second place — import `SITE_URL`.
- App secrets (`GMAIL_USER`, `GMAIL_APP_PASSWORD`, `LEADS_EMAIL`, `DAILY_REPORT_HOUR`,
  `DAILY_REPORT_MINUTE`, `TRACKING_BASE_URL`) live in `.env.local`, passed to the app container via
  `env_file:` — never baked into the image.
- `.dockerignore` excludes `node_modules`, `.next`, `.git`, and `data/` from the build context.

## OPEN QUESTIONS — confirm before building
1. **"Volumetric × 3" rule.** Brief says: if volumetric > actual, chargeable = volumetric × 3. That's a 3×
   penalty stacked on top of already taking the max — almost certainly a misread of the divisor. Standard is
   just max(actual, volumetric). Do NOT encode the ×3 until confirmed; it directly changes what customers pay.
   **Resolved: using the standard max(actual, volumetric) rule.**
2. **Air minimum.** Brief said air starts at 10kg; the rate sheet has a 5–10kg tier (per-0.5kg pricing). Use
   the sheet (5kg min) unless told otherwise.
3. ~~Lead delivery channel: Telegram, email, or both?~~ **Resolved: email only (Gmail SMTP), no Telegram.**
4. Is the sourcing commission (5–10%) shown publicly, or quoted privately?

## Conventions for Claude Code
- TypeScript strict, no `any`. Rates + calc fully typed.
- No price or copy literals in components — import from `lib/` and `messages/`.
- Server-only secrets live in Route Handlers, never in the client bundle.
- Keep components small and section-scoped; the page just composes them.