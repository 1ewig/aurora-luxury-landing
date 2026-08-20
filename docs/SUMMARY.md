# Aurora — System Context & Architecture Guide

> This document is the SINGLE architecture reference for this codebase — the primary context source for AI agents. It captures architectural decisions, domain models, routing, and mandatory conventions. It deliberately avoids line-level implementation details. For style rules see `docs/CODING_STANDARDS.md`; for deployment see `docs/BACKEND_DEPLOYMENT.md`. Keep this file in sync whenever architecture, routes, or schema change.

## 1. Executive Summary & Domain Purpose

- **What it is:** Aurora is a direct-to-consumer luxury fashion e-commerce application — a premium clothing storefront ("Singular pieces for the considered wardrobe") with a full customer account area and a role-gated admin back-office. Live at `aurora-nu-three.vercel.app`.
- **Target audience:** (1) shoppers purchasing premium apparel online, (2) store operators managing catalog, orders, users, and inventory via an internal admin console.
- **Core business problem solved:** A single platform that couples a high-fidelity, animated marketing storefront with a production-grade commerce backend: real inventory management, guest-friendly checkout, payment integrity, and admin operations — without SaaS lock-in for the data layer (self-owned Postgres via InsForge BaaS).
- **Defining product decisions:**
  - **Guest checkout is the default.** `orders.user_id` is nullable; accounts are optional and surfaced as upsell (order history requires an account).
  - Checkout redirects to a **Lemon Squeezy overlay** (embed mode) rather than an in-house payment form; card fields are validated client-side only and unused (future card-on-file support).
  - Catalog content is **seeded from static files** (`src/data/*`) into Postgres; all runtime reads hit the DB, never the static files (except navigation + testimonials).
- **Non-functional requirements:**
  - **Payment integrity:** server-side price re-computation (client price tampering is impossible), transactional stock locking with row-level `FOR UPDATE`, 35-minute soft stock reservations, HMAC-SHA256 webhook verification with `crypto.timingSafeEqual`, and idempotent webhook processing (event + LS order id unique constraints).
  - **Security:** RBAC role gates on every admin endpoint (401/403), DB-backed rate limiting (auth endpoints, newsletter, checkout), CSRF protection, secure cookies in production, input sanitization (HTML-strip + length caps), JSON-LD XSS escaping, parameterized SQL everywhere, whitelisted sort/status/role enums.
  - **Performance:** `use cache` directive-based caching (60s–60min TTLs), `json_agg` single-roundtrip queries (no N+1), parallel dashboard queries, client-side React Query caching (5 min stale / 10 min GC), AVIF/WebP image optimization, code-split below-fold landing sections.
  - **Compliance/traceability:** full audit log (`audit_logs`) of every admin mutation with old→new diffs; idempotent payment event ledger.
- **Operational metrics of note:** 15 public tables + 5 `better_auth` tables; 17 pages; 20 API route handlers; 102 components; 24 test files; two cron jobs (reservation + rate-limit cleanup).

## 2. Technical Stack & Infrastructure

| Layer | Technology / Library | Purpose in this Project | Key Configuration / Notes |
|---|---|---|---|
| Framework | Next.js 16.2.9 (App Router) | Full-stack framework: RSC pages, route handlers, caching, metadata | `next.config.ts` sets `cacheComponents: true` (enables `use cache`); NO `middleware.ts` — v16 renamed middleware → proxy (`src/proxy.ts` is the active edge protection); NO `generateStaticParams`, NO `export const revalidate` — caching is exclusively `use cache` directives |
| UI Runtime | React 19.2.7 | Server + Client Components | Async `params`/`headers` (awaited promises, Next 15+/16 convention); streaming via `<Suspense>`; `react.cache()` for per-request memoization |
| Language | TypeScript 5.9.3 (strict) | All code | `moduleResolution: bundler`, `noUnusedLocals/Parameters`, `noFallthroughCasesInSwitch`, path alias `@/*` → `src/*` |
| Runtime / Tooling | Bun | Package manager + dev/build/test runner | ALWAYS `bun`, never npm/pnpm/npx; `bun run dev / build / lint / test` |
| Database | PostgreSQL via InsForge BaaS | All persistence | Raw `pg` Pool (`src/utils/db.ts`), NO ORM; two pools: public pool + a dedicated `better_auth`-scoped pool; SSL on when connection string includes `sslmode`; `idleTimeoutMillis: 1000` so builds exit cleanly |
| ORM | None (deliberate) | — | Hand-written parameterized SQL (`$1, $2`); `withTransaction()` helper wraps BEGIN/COMMIT/ROLLBACK |
| BaaS | InsForge `@insforge/sdk` 1.3.1 | Postgres hosting + object storage (5 buckets: `product-media`, `lookbook-media`, `editorial-media`, `material-media`, `category-media`) + JWT bridge for client access | Dual clients: `src/lib/insforge.ts` (browser, JWT auto-refresh every 50 min via `/api/insforge-token`) vs `src/lib/insforge.server.ts` (server, HS256 JWT signed with `INSFORGE_JWT_SECRET`, 1 h expiry) |
| Auth | Better Auth 1.6.18 (email/password) | Sessions, sign-in/up, email verification, password reset — NOT InsForge auth | DB-backed rate limiting (5/min sign-in & sign-up, 3/min emails, unlimited `/get-session`); 7-day session / 1-day sliding window; cookie cache 5 min; CSRF on; Brevo emails |
| Payments | Lemon Squeezy (REST v1 + webhooks) | Checkout overlay (embed mode) + order fulfillment trigger | Custom price per order, JSON:API format; cart/shipping/reservation data survives round-trip as JSON strings in `checkout_data.custom`; webhook secret HMAC verified |
| Styling | Tailwind CSS 4.1.17 | Design system + animations | `@tailwindcss/postcss`; `clsx` + `tailwind-merge` (`cn()`); Google Fonts (Inter + Playfair Display) via `next/font` as CSS vars (`--font-inter`, `--font-playfair`) |
| Client State | Zustand 5.0.13 | Cart (persisted), auth, UI | Cart persisted to localStorage; auth store is vanilla `createStore` + React Context (SSR-safe) |
| Server State | TanStack React Query 5.101 | All API fetching on client | `staleTime: 5 min`, `gcTime: 10 min`, `refetchOnWindowFocus: false`; admin queries use `staleTime: 0` + `keepPreviousData` |
| Validation & Schemas | Zod 3.24 + Hand-rolled | Admin payload schemas + checkout & address validation | Strict Zod schemas (`src/utils/schemas.ts`, `.strict()`, HTTPS media URL sanitization); checkout per-field validators (`src/utils/validation.ts`, `src/utils/sanitize.ts`) |
| Motion/UI | Framer Motion 12.38, Embla Carousel 8.6 | Scroll animations, drawers, carousels | Shared presets in `src/animations/` (`easeOutQuart` house easing, spring presets, stagger variants) |
| Email | Nodemailer 9 + Brevo (Sendinblue) SMTP | Verification, password reset, sign-up alert, order confirmation | Silently skips when SMTP env vars absent (dev); send failures are non-fatal except in Better Auth callbacks (which throw) |
| Testing | Vitest 4.1.9 | Unit + API integration tests | `globals: true`, node env, `@` alias; all DB access mocked via `vi.mock` — no live DB needed; route handlers dynamically imported per-test; coverage via `bun run test:coverage` (istanbul provider — v8 is unsupported under Bun) |
| Linting | ESLint 10 (flat config) | Code quality | `next/core-web-vitals` + `next/recommended`, `@typescript-eslint/parser` |
| Analytics | `@vercel/analytics` | Web vitals tracking | Injected once in root layout |
| Image pipeline | `sharp` 0.34.5 | Offline image optimization | `scripts/optimize-images.mjs`: JPG/PNG → WebP (q100, 2000px max) into `public/images/` |
| Misc | `jsonwebtoken` 9, `server-only` | JWT bridge signing; server-only module enforcement | `'server-only'` import guard on server utilities (`db.ts`, `admin.ts`, etc.) |
| Deployment | Vercel + InsForge | Hosting | `next.config.ts` `images.remotePatterns` allows `**.insforge.app` storage URLs; `allowedDevOrigins` whitelists ngrok domain; image qualities `[100,85,80,75,50]`, formats `avif,webp`, `minimumCacheTTL` 30 days |

## 3. High-Level Architectural Mental Model

### 3.1 The four-layer unidirectional flow

Every feature follows a strict 4-layer pipeline (documented in `docs/CODING_STANDARDS.md`):

   RSC Page (server)  ──renders──▶  XxxClient.tsx (client orchestrator)
                                           │
                                           ├─▶ Hooks (React Query / feature hooks)
                                           └─▶ Stores (Zustand)
                                                   │
                                                   ▼
                                 Presentational components (pure props,
                                 ZERO store/hook imports, may still be "use client"
                                 for motion/state)

- **Layer 1 (Server pages)** do server-side data fetching (or import cached data accessors) and pass `initialData` into the client orchestrator — killing client waterfalls (e.g., landing page server-fetches `getLandingData()`; product detail runs `generateMetadata` DB queries directly).
- **Layer 2 (Client orchestrators)** are the ONLY components that touch hooks/stores. Naming convention: `XxxClient.tsx` next to its page.
- **Layer 3 (Hooks/Stores)** own all client-side logic; feature hooks wrap query hooks + business rules.
- **Layer 4 (Presentational)** receive everything via props. The distinguishing rule is the absence of store/hook imports — not the `"use client"` directive. Genuine server components in this layer: `Footer.tsx` (imports cached categories), `AuthInitializer.tsx` (async, SSR session hydration).

### 3.2 End-to-end data movement (primary flows)

**Read (catalog):** Browser → RSC page (or client React Query) → `/api/products*` route handler → `use cache` layer → `pool.query` (parameterized SQL, `json_agg` subqueries) → camelCase JSON → React Query cache → presentational components.

**Mutation (admin):** Admin UI → client orchestrator → mutation hook → `POST/PUT/PATCH/DELETE /api/admin/*` → `requireAdmin()` guard (session → DB role check → level compare) → `withTransaction` → SQL mutation → `revalidateTag('products', {expire: 0})` + `logAudit()` → JSON response → query invalidation (`['admin','products']`, `['products']`, `['product']`).

**Checkout (guest):** Checkout form (client-validated + sanitized) → `POST /api/checkout/session` (rate limited 10/min/IP) → server re-fetches product prices from DB → `withTransaction` with `SELECT … FOR UPDATE` row locks (ordered by product_id+size to prevent deadlocks) → 35-min soft reservations in `product_reservations` → Lemon Squeezy checkout creation → LS overlay opens → payment → LS webhook → idempotency check → transaction: stock debit, reservation delete, order insert (`AUR-XXXXXXXX`), `ls_customer_id` link → confirmation email (fire-and-forget) → redirect to `/checkout/success?order_id=[ls]` → success page polls orders API (up to 10× @ 1.5 s) and clears the cart.

### 3.3 Server vs. Client boundary strategy

- **Everything is a Server Component by default**; `"use client"` is added only at orchestration/interaction boundaries.
- **Boundaries set where interactivity begins:** route-group layout shells (admin sidebar, profile gate), cart drawer, filters, forms, and animation-driven sections.
- **Key pattern:** server pages do the expensive work (DB reads, metadata, SEO) and hand `initialData` to client components — keeping the client tree lean and TTFB low.
- **Streaming:** root layout wraps `AuthInitializer` in `<Suspense fallback={null}>` so session hydration never blocks page streaming. `/checkout/success` wraps its `useSearchParams` consumer in `<Suspense>` to avoid whole-page CSR de-optimization.
- **Scripts:** Lemon Squeezy overlay SDK loaded via `<Script strategy="afterInteractive">`.

### 3.4 Caching, Revalidation & Rendering

- **Rendering:** fully dynamic (no static export, no `generateStaticParams`); the storefront leans on server caching + client React Query rather than SSG/ISR.
- **`use cache` directive** (Next 16 `cacheComponents`) is the caching backbone, each accessor pairing `cacheLife({ stale, revalidate })` with `cacheTag(...)`:

| Tag | TTL (stale/revalidate) | Consumers |
|---|---|---|
| `landing` | 60 s | Homepage aggregated data (`/api/landing`, imported server-to-server as `getLandingData()`) |
| `products` | 300 s | `/api/products`, `/api/products/[slug]`, category name lookup |
| `categories` | 300 s | `/api/categories`, category slug→name map |
| `editorial` | 600 s | `/api/editorial` (story page) |
| sitemap | 3600 s | `sitemap.ts` |

- **Invalidation:** every admin product/create/update/delete calls `revalidateTag('products', { expire: 0 })` and `revalidateTag('landing', { expire: 0 })` (the new `expire` option forces immediate invalidation). Client-side invalidation complements this via React Query.
- **`rethrowIfDynamicServerError()`** is called in every route handler catch block: it re-throws Next's internal prerendering bail-out signals (`DYNAMIC_SERVER_USAGE`, etc.) so cached routes degrade to dynamic rendering instead of 500ing. App-level catch blocks must never swallow these.
- **React Query defaults:** 5 min stale / 10 min GC / no refetch-on-focus; admin queries opt into `staleTime: 0`.

### 3.5 Authentication & Authorization

- **Session:** Better Auth cookie (`better-auth.session_token`), 7-day expiry with 1-day sliding renewal, 5-min cookie cache. Email verification required before sign-in; `autoSignInAfterVerification`; 1 h verification/reset token TTL.
- **RBAC:** `role` column on `better_auth."user"` maps to levels — `user=0`, `admin=10`. Guards: `requireRole(minLevel)` / `requireAdmin()` return 401 (no session) / 403 (insufficient role). **Legacy fallback:** `ADMIN_EMAILS` env whitelist still promoted to admin while DB roles roll out (`isAdmin()` checks role first, then whitelist).
- **Enforcement layers:**
  1. `src/proxy.ts` — the **active** Next.js 16 edge proxy (v16 renamed `middleware` → `proxy`; `proxy.ts` exporting `proxy` is the correct convention). Protects `/admin` and `/profile` at the edge: session-cookie fast path → login redirect, admin role check via `/api/auth/role`, profile session check via `/api/auth/get-session`. Base URL derived dynamically from incoming request origin.
  2. **Server Layout Gates & API-level guards:** `(admin)/admin/layout.tsx` enforces `requireAdmin()` and `(user)/layout.tsx` enforces `getServerAuthUser()` server-side before rendering client shells; all `/api/admin/*` and `/api/insforge-token` endpoints independently enforce `requireAdmin()` (401/403).
  3. **Client gates:** `UserLayoutClient` and `AdminLayoutClient` provide redundant client-side navigation UI gates.
- **Route protection summary:** storefront + auth pages public; `/profile*` = edge proxy + layout server gate + client gate; `/admin*` = edge proxy + layout server gate + API guards + client shells.
- **Role to the client:** `/api/auth/role` returns `{isAdmin, role}`; `getServerAuthUser()` (React `cache()`-memoized per request) gives RSC pages a client-safe user object.

### 3.6 Design, motion & content conventions

- **House motion style:** ~0.8 s fade/slide entrances with `easeOutQuart` easing; index-staggered variants factories (0.07–0.12 s delay steps); spring presets for interactive elements (`Button` whileHover 1.02 / whileTap 0.97); `AnimatePresence` for drawers and modals; below-fold sections use `next/dynamic` + `LazySection` (IntersectionObserver, 300 px rootMargin).
- **Typography/brand:** Inter (body) + Playfair Display (headings) via `next/font` CSS variables; Tailwind 4 `@theme` tokens reference them; editorial cream/black palette with `#E9C8A0` accent (favicon monogram).
- **Money formatting:** `formatCurrency()` renders whole dollars (`Intl.NumberFormat` en-US, zero fraction digits) — luxury presentation, not cents.
- **Content model:** catalog/lookbook/editorial/materials live in the DB (seeded from `src/data/*`); only navigation links and testimonials are static runtime data.

## 4. Directory Structure Map

aurora/
├─ SUMMARY.md                     ← this document
├─ AGENTS.md                      ← agent instructions (Bun, InsForge, verification order)
├─ next.config.ts                 ← cacheComponents, image formats/remotePatterns
├─ insforge.toml                  ← InsForge project config (storage limit 50 MB)
├─ .env.example                   ← every env var with usage comment (see §2/§7)
├─ src/
│  ├─ app/                        ← Next App Router root
│  │  ├─ layout.tsx               ← root: fonts, metadata, Providers + Suspense + AuthInitializer
│  │  ├─ providers.tsx            ← React Query client (5min/10min/refocus off)
│  │  ├─ globals.css / icon.svg   ← Tailwind 4 theme tokens; inline "A" monogram favicon
│  │  ├─ robots.ts / sitemap.ts   ← SEO metadata routes (sitemap uses `use cache`, 1 h)
│  │  ├─ (store)/                 ← public storefront group: layout (Navbar/CartDrawer/Footer),
│  │  │                            landing, story, products(+[slug], +category/[category]),
│  │  │                            checkout(+success), not-found
│  │  ├─ (auth)/                  ← login, register, verify, reset-password (all noindex)
│  │  ├─ (user)/                  ← profile + profile/orders; layout gates auth client-side
│  │  ├─ (admin)/admin/           ← layout (sidebar shell) + dashboard/users/orders/inventory/activity
│  │  └─ api/                     ← 20 route handlers (see §7)
│  ├─ components/                 ← 102 presentational + orchestrator components
│  │  ├─ ui/                      ← generic: Button, ProductCard, CartDrawer, Pagination,
│  │  │                            AdminSidebar, LazySection, ConfirmDialog, badges, skeletons
│  │  ├─ layout/                  ← Navbar(+profile menu), AnnouncementBar, MobileMenu, Footer
│  │  ├─ landing/ story/          ← storefront sections (client orchestrators + sections)
│  │  ├─ product/listing, /detail ← catalog + PDP (filters, gallery, size selector, tabs)
│  │  ├─ checkout/                ← CheckoutPageClient, CheckoutForm, OrderSummary, Success
│  │  ├─ auth/                    ← LoginClient/Form, Register, Verify, ResetPassword, AuthInitializer
│  │  ├─ profile/ (+orders/)      ← ProfileClient, ProfileForm, sidebar, OrdersClient, modals
│  │  └─ admin/                   ← dashboard/, users/, orders/, inventory/, activity/ (per-feature)
│  ├─ hooks/
│  │  ├─ queries/                 ← React Query hooks: products, orders, landing, content, admin (barrel index)
│  │  ├─ ui/                      ← useNavbarScroll, useCarousel, useBodyScrollLock
│  │  └─ *.ts                     ← feature hooks: useProductForm, useCheckoutForm, useOrdersManagement,
│  │                               useUsersManagement, useUserSessions, useAdminDashboard, etc.
│  ├─ stores/
│  │  ├─ useCartStore.tsx         ← Zustand cart (localStorage persisted) + drawer open state
│  │  ├─ useAuthStore.tsx         ← vanilla createStore + React Context; session/role/actions
│  │  ├─ useAdminStore.ts         ← TYPE-ONLY repository (SizeStock, ProductData, OrderData, metrics)
│  │  └─ useProductStore.ts       ← PDP UI state (selected size, gallery index, etc.)
│  ├─ lib/                        ← client/server singletons
│  │  ├─ auth.ts                  ← Better Auth server config (rate limits, sessions, emails)
│  │  ├─ auth-client.ts           ← Better Auth browser client (signIn/signUp/signOut/useSession)
│  │  ├─ insforge.ts              ← useInsforgeClient hook (JWT bridge, 50-min refresh)
│  │  ├─ insforge.server.ts       ← server SDK factory (signs HS256 JWT for InsForge gateway)
│  │  ├─ email.ts                 ← Nodemailer/Brevo sender (lazy transporter, silent-skip)
│  │  ├─ email-templates.ts       ← branded HTML/text templates (verify, reset, sign-up alert)
│  │  └─ lemonsqueezy.ts          ← LS API client (createCheckout with custom price + custom data)
│  ├─ utils/
│  │  ├─ db.ts                    ← pg Pool + withTransaction()
│  │  ├─ admin.ts                 ← requireRole/requireAdmin/getServerAuthUser (React.cache)
│  │  ├─ auth.ts                  ← isAdmin (role→ADMIN_EMAILS fallback), buildUserState, fetchUserRole
│  │  ├─ validation.ts            ← per-field checkout validators (email, ZIP, card, CVC)
│  │  ├─ schemas.ts               ← strict Zod schemas for admin mutation payloads & media URL sanitization
│  │  ├─ sanitize.ts              ← HTML-strip + address validation (ShippingAddress, VerifiedItem)
│  │  ├─ pricing.ts               ← shipping ($25, free >$500) + 8% tax calculator
│  │  ├─ rateLimit.ts             ← DB sliding-window rate limiter (rate_limits table, anti-spoofing)
│  │  ├─ audit.ts                 ← logAudit() inserts into audit_logs
│  │  ├─ errors.ts                ← rethrowIfDynamicServerError()
│  │  ├─ env.ts                   ← requireEnv() type-safe env access
│  │  ├─ insforge.ts + insforge/  ← storage URL↔key mapping; client/server SDK factories
│  │  ├─ admin.ts / formatCurrency.ts / cn.ts
│  │  └─ proxy.ts                 ← ACTIVE Next.js 16 edge proxy (v16 renamed middleware → proxy); gates /profile + /admin
│  ├─ data/                       ← static seed source-of-truth (products, categories, navigation,
│  │                               materials, lookbook, editorial, testimonials) — consumed by seed scripts
│  ├─ types/lemonsqueezy.d.ts     ← window augmentation for LS overlay widget
│  └─ animations/                 ← framer-motion variants + transition presets (house style)
├─ scripts/                       ← infra/ops tooling (see §7.4)
├─ migrations/                    ← single SQL migration (better-auth setup, orders.user_id UUID→TEXT)
├─ __tests__/                     ← 24 Vitest files (api/ 13, stores/ 2, utils/ 10 — 230 tests)
├─ docs/                          ← SUMMARY.md (single architecture reference), CODING_STANDARDS.md,
│                                   performance-analysis.md, BACKEND_DEPLOYMENT.md
├─ public/images/                 ← optimized WebP catalog assets (uploaded to InsForge buckets)
└─ images-sources/                ← raw JPG/PNG inputs for the sharp pipeline

## 5. Domain Models & Data Schema Concepts

Schema lives in `scripts/create-tables.sql` (master DDL with RLS, triggers, cron) — there is NO migration framework; the `migrations/` folder holds only the Better Auth bootstrap. All tables live in the `public` schema except Better Auth's `better_auth` schema.

### 5.1 Public schema entities

| Table | Key Columns | Notes / Relationships |
|---|---|---|
| `categories` | `slug` (PK, varchar 50), `name` (UNIQUE), `image`, `description` | RLS: public read, admin write. 5 categories: Outerwear, Knitwear, Trousers, Dresses, Accessories |
| `products` | `id` (PK, varchar 50), `slug` (UNIQUE + lowercase unique index), `name`, `category` (FK → categories.name, ON UPDATE CASCADE), `price` (numeric, ≥0 CHECK), `badge`, `image`, `alt_text`, `span`, `aspect_ratio`, `description`, timestamps (auto via `set_updated_at` trigger) | Parent of 4 child tables; RLS public read / admin write |
| `product_images` | `product_id` (FK, CASCADE), `image_url` | 1:N gallery images |
| `product_sizes` | `product_id` (FK, CASCADE), `size`, `stock` (int, default 10), **UNIQUE(product_id, size)** | Composite key is the FK target for reservations; locked with `FOR UPDATE` at checkout |
| `product_details` | `product_id` (FK, CASCADE), `detail` | Bullet-point list items |
| `product_keywords` | `product_id` (FK, CASCADE), `keyword` (UNIQUE per product) | Powers ILIKE search across name/description/keywords |
| `orders` | `id` (UUID, gen_random_uuid), `user_id` (**TEXT, NULLABLE — guest checkout**; no FK), `order_number` (UNIQUE, `AUR-XXXXXXXX`), `items` (**JSONB** — line items incl. size, qty, price, snapshot), `subtotal/shipping/tax/total` (numeric), `shipping_address` (JSONB), `status` (CHECK enum, see 5.3), `is_paid`, `payment_provider`, `ls_order_id` (UNIQUE — webhook dedup), `ls_order_number` | RLS: owner or admin. NO `order_items` table — items are JSONB denormalized snapshots |
| `processed_webhooks` | `ls_event_id` (UNIQUE) | Idempotency ledger for LS `order_created` events; service-role only |
| `product_reservations` | `id`, `reservation_id` (UUID, shared per checkout), `product_id` + `size` (composite FK → product_sizes ON DELETE CASCADE), `quantity`, `expires_at` | 35-min soft reservation TTL; consumed or deleted on webhook/rollback; cleaned by cron every 5 min |
| `lookbook_slides` | `slide_number` (UNIQUE), `original_image` (local path), `image_url` (storage URL), `tag`, `title`, `link`, `alt_text` | Marketing slider content |
| `editorial_content` | `id` (PK), `original_image`, `image_url`, `title`, `description` | Brand-story blocks |
| `materials` | `name` (UNIQUE), `source`, `original_image`, `image_url`, `description`, `properties` (TEXT[]) | Luxury textile facts |
| `newsletter_subscriptions` | `email` (UNIQUE), `status` (CHECK: 'active') | Newsletter signups |
| `rate_limits` | `ip`, `route`, `window_start` (minute-truncated), `request_count`, **UNIQUE(ip, route, window_start)** | DB-backed sliding-window limiter; hourly cron purge |
| `audit_logs` | `admin_id`, `admin_email`, `action`, `target_type`, `target_id`, `metadata` (JSONB) | Immutable admin audit trail |

### 5.2 `better_auth` schema

`user` (id TEXT PK, email UNIQUE, `emailVerified`, **`role` TEXT default 'user'** — app RBAC, `ls_customer_id` — LS customer link, plus BA-standard columns) — `session` (token UNIQUE, FK CASCADE to user) — `account` (provider accounts; `password` holds the bcrypt hash for the credentials provider) — `verification` (token/identifier/expiry) — `"rateLimit"` (BA's own DB rate limiting).

### 5.3 Key state machines & transitions

- **Order status** (`CHECK` constraint): `pending` → `confirmed` → `shipped` → `delivered`; terminal `cancelled` reachable from any active state (admin PATCH, whitelist-validated, audited with `{from, to}`).
- **Payment lifecycle:** Checkout created (no DB order yet) → reservation active (35 min) → LS webhook `order_created` → order row created `pending` + stock debited + reservation deleted → paid (LS payment inherent to `order_created`) → status flow via admin.
- **Reservation lifecycle:** created in checkout transaction → **consumed** (webhook, stock debit) or **released** (rollback on checkout/address/LS failure — DELETE by `reservation_id`) or **expired** (cron, 5-min cadence, re-stocks inventory).
- **Stock integrity:** stock is never reduced at checkout time — only row-locked (`FOR UPDATE`) to guarantee availability; debit happens exclusively in the webhook transaction.
- **User → order:** 1:N, optional (guests have no `user_id`); when a session exists, webhook writes `better_auth.user.ls_customer_id` to link LS customer ↔ account.

## 6. Routing & Page Architecture (App Router)

| Path | Route Type | Access Control | Page Purpose | Key Child Components |
|---|---|---|---|---|
| `/` | RSC | Public | Landing/marketing homepage; server-fetched `getLandingData()` (60 s cache) passed as `initialData` | `LandingClient` → 7 lazy-loaded sections (Hero, FeaturedCollection, LookbookSlider, MaterialIndex, DesignerStory, PressClientNotes, Newsletter, MarqueeBar, SignaturePieces) |
| `/story` | RSC | Public | Brand story page; content fetched client-side | `StoryPageClient`, StoryHero, PhilosophySection, AtelierSection, StoryCta |
| `/products` | RSC | Public | Full catalog; URL-synced filters (page, sortBy, search); `initialCategory="All"` | `ProductListingClient` → CategoryFilter, SortFilter, FilterDrawer, ProductGrid, Pagination, PageHeader |
| `/products/[slug]` | RSC | Public | Product detail; `generateMetadata` from DB; JSON-LD Product schema (XSS-escaped); hydration via cached listing | `ProductDetailClient` → ImageGallery, ProductInfo, SizeSelector, SizeGuideModal, ProductDetailsTabs, ProductActions, RelatedProducts |
| `/products/category/[category]` | RSC | Public | Category-scoped listing; cached slug→name lookup; `notFound()` on unknown slug | Same listing tree with category filter preset |
| `/checkout` | RSC | Public (guest default) | Checkout; noindex; loads LS overlay SDK `afterInteractive` | `CheckoutPageClient` → CheckoutForm, OrderSummary/Container, CartEmptyState |
| `/checkout/success` | RSC | Public | Post-payment confirmation; reads `order_id` from query (Suspense-wrapped `useSearchParams`); polls order status; clears cart | `CheckoutSuccessClient` |
| `/login` `/register` | RSC | Public, noindex | Auth forms (redirect-aware `?redirect=`) | LoginClient/LoginForm, RegisterClient/RegisterForm |
| `/verify` | RSC | Public, noindex | Email verification (`?token=&email=`), resend | VerifyClient/VerifyForm |
| `/reset-password` | RSC | Public, noindex | Request reset email + set new password (`?token=`) | ResetPasswordClient/ResetPasswordForm |
| `/profile` | RSC | Authed (edge proxy + client gate) | Account settings: name, email, password, verification status | `ProfileClient`, ProfileForm, ProfileSidebar, ProfileWorkspace |
| `/profile/orders` | RSC | Authed | Purchase history (own orders only) | `OrdersClient`, OrderCard, OrderDetailModal, OrderListLoader |
| `/admin` | RSC | Admin (API-guarded) | Server `redirect()` → `/admin/dashboard` (no flash) | — |
| `/admin/dashboard` | RSC | Admin | KPIs + recent orders + low-stock; parallel queries | `DashboardClient`, MetricsGrid, RecentOrdersList, TaskMenu |
| `/admin/users` | RSC | Admin | User management (search/filter/sort, verify, role, delete) | `UsersClient`, UsersTable, UsersSearchFilters, UserDetailModal |
| `/admin/orders` | RSC | Admin | Order management + status updates | `OrdersClient`, OrdersTable, OrderDetailModal |
| `/admin/inventory` | RSC | Admin | Product CRUD + InsForge image uploads + size/stock editing | `InventoryClient`, InventoryTable, ProductFormModal (BasicDetails/MediaUpload/SizeStock/BulletDetails fields) |
| `/admin/activity` | RSC | Admin | Audit log browser | `ActivityClient`, ActivitySearchFilters |
| `*` (store group) | RSC | Public | Custom 404 scoped to storefront | Return-home link |

**Layouts:** root (fonts/providers) → route-group shells: `(store)` = Navbar + CartDrawerWrapper + Footer; `(user)` = `UserLayoutClient` auth gate → `profile/layout` = `ProfileLayoutClient` (sidebar); `(admin)` = `AdminLayoutClient` (AdminSidebar, mobile header, nav capsule). All admin/user pages export `robots: noindex`; storefront pages are indexable.

## 7. Data Flow, Server Actions & API Map

### 7.1 Server Actions — NONE

This codebase deliberately does **not** use Next.js Server Actions. Every mutation is a **REST route handler** called by React Query mutations (admin) or `fetch` (checkout, newsletter). When extending the app, follow this convention: new mutations go in `/api/*` route handlers, not `"use server"` functions.

### 7.2 Route handlers by access tier

**Public read (cached via `use cache`):**

| Endpoint | Method | Purpose | Validation / Notes |
|---|---|---|---|
| `/api/products` | GET | Catalog list (paged or bare array) | Filters: `category, page, limit, search, sortBy` (sort whitelist); ILIKE search; 5-min cache, tag `products` |
| `/api/products/[slug]` | GET | Full product detail | Case-insensitive slug; 404 on miss; `json_agg` for images/sizes/details; 5-min cache |
| `/api/categories` | GET | Category list | Exports `getCachedCategories()` reused by Footer; 5-min cache, tags `categories`+`products` |
| `/api/editorial` | GET | Story content | 10-min cache, tag `editorial` |
| `/api/landing` | GET | Aggregated homepage data (5 parallel queries) | 60-s cache, tag `landing`; exports `getLandingData()` imported by the landing page directly |

**Public mutation (rate-limited):**

| Endpoint | Method | Purpose | Validation / Notes |
|---|---|---|---|
| `/api/newsletter` | POST | Subscribe + welcome email | Rate 3/min/IP; email regex; unique violation 23505 → 400 "already subscribed"; email failure non-fatal |
| `/api/checkout/session` | POST | Create LS checkout | Rate 10/min/IP; qty 1–10 + duplicate-item merge; **server-side price re-fetch (anti-tampering)**; transaction + `FOR UPDATE` locks (sorted); 35-min reservations; sanitized address; pricing util (free ship >$500, 8% tax); rollback on any failure; returns `{checkoutUrl, checkoutId}` |

**Session-authenticated:**

| Endpoint | Method | Purpose | Validation / Notes |
|---|---|---|---|
| `/api/auth/[...all]` | GET/POST | Better Auth catch-all (sign-in/up, session, verify, reset) | BA's built-in DB rate limits + CSRF; 7-day sessions |
| `/api/auth/role` | GET | `{isAdmin, role}` for UI gating | 401 → guest shape; `Cache-Control: no-store` |
| `/api/orders` | GET | Dual mode: `?lsOrderId=` public order-number lookup (guest success page); else current user's orders | Limit capped 100; snake→camel mapping |

**Admin-only (all guarded by `requireAdmin()`):**

| Endpoint | Method | Purpose | Validation / Notes |
|---|---|---|---|
| `/api/insforge-token` | GET | HS256 JWT bridge token (`sub`, `role: 'admin'`, `aud: 'insforge-api'`, 1 h) | Requires `requireAdmin()` (401/403); `no-store` |
| `/api/admin/dashboard` | GET | KPIs + 5 recent orders | 5 parallel queries; AOV computed server-side; low-stock = distinct products stock < 5 |
| `/api/admin/users` | GET | Paginated user search | ILIKE + verified filter + **whitelisted sort map** (SQL-injection safe) |
| `/api/admin/users/[id]` | GET/PATCH/DELETE | Detail (+sessions), update, delete | PATCH field whitelist (`name`, `emailVerified`, `role` w/ enum); audit with field diff; self-delete blocked (400) |
| `/api/admin/products` | GET/POST | List (nested) / create | POST: transaction, dup check, `revalidateTag` + audit |
| `/api/admin/products/[id]` | PUT/DELETE | Update / delete | PUT: slug uniqueness, InsForge orphan-image cleanup (usage-count check before bucket delete), delete+reinsert children, revalidate + audit; DELETE: storage cleanup → CASCADE → revalidate + audit |
| `/api/admin/orders` | GET | Paginated orders + shipping | Search across number/email/names; status filter; images attached in second query |
| `/api/admin/orders/[id]` | PATCH | Status update | Status whitelist `[pending, confirmed, shipped, delivered, cancelled]`; audit `order.update_status` with `{from,to}` |
| `/api/admin/audit` | GET | Audit log browsing | Filters targetType/action/search; offset/limit pagination |

**Webhook (signature auth, no session):**

| Endpoint | Method | Purpose | Validation / Notes |
|---|---|---|---|
| `/api/webhooks/lemonsqueezy` | POST | `order_created` fulfillment | Raw body read before parsing (HMAC requirement); `crypto.timingSafeEqual` + length pre-check; custom_data parsed as object OR JSON string; idempotency via `processed_webhooks` ON CONFLICT + `orders.ls_order_id` UNIQUE; transaction: `FOR UPDATE` locks → stock debit → reservation delete → order insert → `ls_customer_id` link; non-fatal confirmation email; non-`order_created` events ack+ignore |

### 7.3 External services integration

| Service | Interface | Credentials (env) | Failure semantics |
|---|---|---|---|
| **Lemon Squeezy** | REST v1 (`createCheckout`, JSON:API) + webhook HMAC-SHA256 | `LEMON_SQUEEZY_API_KEY`, `LEMON_SQUEEZY_STORE_ID`, `LEMON_SQUEEZY_WEBHOOK_SECRET`, `NEXT_PUBLIC_LS_ORDER_VARIANT_ID` | Checkout failure → reservation rollback + 500 to client; webhook 500 for retry (LS retries); overlay events drive UI |
| **InsForge** | Postgres (via `pg`), storage SDK, JWT gateway | `DATABASE_URL`, `NEXT_PUBLIC_INSFORGE_URL`, `NEXT_PUBLIC_INSFORGE_ANON_KEY`, `INSFORGE_API_KEY`, `INSFORGE_JWT_SECRET` | Server SDK returns null (anon client) when unauthenticated; storage cleanup failures logged |
| **Brevo SMTP** | Nodemailer over SMTP | `BREVO_SMTP_HOST/PORT/USER/PASS/FROM_EMAIL/FROM_NAME` | Silent-skip when unconfigured; failures logged; BA callbacks re-throw |
| **Better Auth** | Server instance + React client + catch-all route | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL` | Session reads never throw to UI; sign-in errors mapped to friendly codes |
| **Vercel Analytics** | SDK injection | — | Passive |

### 7.4 Operational scripts (`scripts/`)

| Script | Purpose |
|---|---|
| `create-tables.sql` | Master DDL: 15 public tables, indexes, RLS, triggers, `pg_cron` jobs |
| `setup-db.js` | Creates `better_auth` schema + 5 BA tables + applies migration |
| `upload-and-seed.mts` | Full wipe & reseed: 5 buckets, 25-concurrency image uploads, seeds categories/products (slug-deduped, auto search keywords, stock 10)/lookbook/editorial/materials; `--catalog-only` preserves orders |
| `update-catalog.mts` | Interactive catalog sync (sync/add/delete) with storage cleanup + rewrites `src/data/products.ts` |
| `wipe-db.mts` | Full teardown (tables + better_auth schema) |
| `manage-user.ts` | Interactive CLI: create user (hashed via `better-auth/crypto`), change role, delete user |
| `optimize-images.mjs` | Sharp batch conversion `images-sources/` → WebP into `public/images/` |

### 7.5 Environment variable inventory (all defined in `.env.example`)

| Variable | Visibility | Purpose |
|---|---|---|
| `DATABASE_URL` | server | Postgres connection (SSL negotiated from `sslmode` in the string) |
| `NEXT_PUBLIC_INSFORGE_URL` / `NEXT_PUBLIC_INSFORGE_ANON_KEY` | public | Browser InsForge client (storage/edge) |
| `INSFORGE_API_KEY` | server | Admin InsForge client (storage cleanup) |
| `INSFORGE_JWT_SECRET` | server | Signs the HS256 bridge token (get via `bunx @insforge/cli secrets get JWT_SECRET`) |
| `ADMIN_EMAILS` | server | Legacy admin whitelist (comma-separated); fallback behind DB `role` |
| `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` / `NEXT_PUBLIC_BETTER_AUTH_URL` | both | Better Auth signing, server base URL, browser base URL |
| `NEXT_PUBLIC_APP_URL` | public | Trusted origin for CSRF + callback URLs; LS redirect base |
| `BREVO_SMTP_*` (host, port, user, pass, from email/name) | server | Transactional email transport |
| `LEMON_SQUEEZY_API_KEY` / `LEMON_SQUEEZY_STORE_ID` / `LEMON_SQUEEZY_WEBHOOK_SECRET` | server | LS REST API + webhook HMAC verification |
| `NEXT_PUBLIC_LS_ORDER_VARIANT_ID` | public | LS variant backing every order (prices are overridden server-side per order) |

## 8. Global State & Context Management

- **Zustand (`useCartStore`):** persisted to localStorage; state `items` (merge key = product id + size), `isOpen`; actions `addItem/removeItem/updateQuantity/clearCart/openCart/closeCart/toggleCart` + derived `totalItems()/totalPrice()`. Consumed by Navbar cart icon, CartDrawer, PDP `ProductActions`, checkout. Cleared on checkout success.
- **Zustand + Context (`useAuthStore`):** SSR-safe pattern — vanilla `createStore` held in a React Context provider (`AuthProvider`), lazy-initialized via `useRef`, with a fallback singleton for tests/dev. Actions: `signIn` (returns `needsVerification` on 403/email-not-verified), `signUp`, `signOut` (local cleanup even if API fails), `updateProfile`, `verifyEmail`, `resendVerification`, `sendResetPasswordEmail`, `resetPassword`, `changePassword`, `clearError`. Every action follows: set loading → `authClient` call → `mapBetterAuthError` → `fetchUserRole()` → `buildUserState()`. Hydrated server-side by `AuthInitializer` via `getServerAuthUser()`, re-hydrated client-side on mount (covers hard refreshes).
- **`useProductStore`:** PDP-local UI state (selected size, gallery, related products). **`useAdminStore`:** type-only repository (no runtime state) — defines `SizeStock`, `ProductData`, `OrderItem`, `ShippingAddress`, `OrderData`, `DashboardMetrics`, `RecentOrder`.
- **React Query (server state):** query keys are string-array prefixes — public: `['products', …]`, `['product', slug]`, `['orders', userId, …]`, `['landing']`, `['editorial']`, `['categories']`; admin: `['admin','dashboard'|'products'|'orders'|'users'|'users',id,'sessions'|'audit', params]`. Admin queries: `staleTime: 0` + `keepPreviousData`. Mutations invalidate by convention: product mutations → `['admin','products']` + `['products']` + `['product']`; order status → `['admin','orders']` + `['admin','dashboard']`; user mutations → `['admin','users']`.
- **URL as state:** product listing uses search params (`page`, `sortBy`, `search`) as the source of truth (`useProductFilter`), category via route segments.
- **Forms:** hand-rolled state + per-field validators (`validateField`/`validateAll`) and sanitizers — no React Hook Form, no Zod, no form libraries. Checkout keeps a sessionStorage snapshot for resilience. Admin product form (`useProductForm`, ~15 fields) includes auto-slug generation, size/stock list editing, and InsForge media upload with local previews.
- **Error handling:** API responses uniformly `{error: string}` with 400/401/403/404/429/500; route handlers follow `try/catch → rethrowIfDynamicServerError → console.error → JSON error`. There are **no `error.tsx`/`global-error.tsx` boundaries** and **no toast system** — client errors surface inline in forms (auth store error state, checkout field errors) or silently log. Observability = console + Vercel Analytics only (no Sentry/logger).
- **Skeleton/loading UX:** every data page ships a `loading.tsx` with a matching `*Skeleton` component (DashboardSkeleton, UsersSkeleton, OrdersSkeleton, InventorySkeleton, ActivitySkeleton, ProfileSkeleton, AuthSkeleton) — one skeleton component per admin/profile page.

## 9. Non-Negotiable Architectural Rules & Conventions

Future AI agents MUST follow these when modifying this codebase:

1. **Use `bun`, never npm/pnpm/npx** — for install, dev, build, lint, test.
2. **4-layer unidirectional flow:** RSC page → `XxxClient.tsx` orchestrator → Hooks/Stores → presentational. Presentational components MUST have zero store/hook imports (see `docs/CODING_STANDARDS.md`).
3. **No Server Actions.** All mutations go through route handlers in `/api/*`. New mutations: add a route handler + a React Query mutation hook, then invalidate the relevant query keys.
4. **No ORM.** Raw parameterized SQL via `pg` (`$1, $2`). Never interpolate user input into SQL; whitelist any `ORDER BY`/status/role values.
5. **Never import database instances into Client Components.** `@/utils/db`, `@/lib/auth`, and InsForge server factories are `server-only`; client data flows exclusively through API routes + React Query.
6. **Validate URL params and dynamic route params** (Zod or hand-rolled) before any query execution; use `await params`/`await headers()` (Next 15+/16 async convention).
7. **Cache with `use cache` + `cacheLife` + `cacheTag`** (never `export const revalidate`). After any admin catalog mutation call `revalidateTag('products', {expire: 0})` and `revalidateTag('landing', {expire: 0})`.
8. **Never swallow `DynamicServerError`** — always run errors through `rethrowIfDynamicServerError()` in route handlers/server utilities before logging.
9. **Guard every admin endpoint with `requireAdmin()`** and audit every admin mutation with `logAudit()` (include field diffs for updates). Respect the role levels `user=0 / admin=10`.
10. **Rate-limit public mutation endpoints** via `rateLimit()` (DB-backed); keep the `rate_limits` contract (ip, route, minute window).
11. **Keep the schema source-of-truth in `scripts/create-tables.sql`** — the `migrations/` folder is not a general migration framework. Update DDL + RLS + cron there, then apply via `setup-db.js` flow.
12. **Guest checkout stays default:** `orders.user_id` is nullable; don't add NOT NULL or FK constraints. Orders store line items as JSONB snapshots — no `order_items` table.
13. **`src/proxy.ts` is ACTIVE edge protection** — it is the Next.js 16 proxy convention (v16 renamed `middleware` → `proxy`; `proxy.ts` exporting `proxy` is the correct, active form). Changes to it affect `/profile` and `/admin` gating: keep the cookie fast-path and role/session checks in sync with Better Auth config.
14. **Auth is Better Auth, not InsForge auth** — InsForge is used for Postgres, storage, and the JWT bridge only.
15. **Validation before both client and server:** checkout fields are validated client-side AND re-sanitized server-side (never trust the client; server re-prices from DB).
16. **Verification order:** `bun run lint` → `bun run test` → `bun run build`. Tests mock the DB (`vi.mock` + shared `__tests__/utils/mocks.ts`); keep route handlers dynamically importable so env-dependent tests work. GitHub Actions (`.github/workflows/ci.yml`) runs lint + test on every PR/push to `main`, and `bun run build` completes full verification by building and typechecking the production bundle.

### 9.1 Known gotchas & landmines

- **`src/proxy.ts` is active edge protection** — it gates `/profile` and `/admin` before any page renders (cookie fast-path → login redirect; role/session checks via `/api/auth/*`). Do not assume it is dead code, and keep its matcher/checks in sync with Better Auth config.
- **Build hangs on open pg connections** — the pool's 1-second idle timeout exists specifically to let `next build` exit; don't "fix" it by removing it.
- **Tests do NOT need a live DB** — all DB access is mocked via `vi.mock("@/utils/db")`; the route handlers are re-imported per test so env vars applied mid-test take effect.
- **`use cache` requires `cacheComponents: true`** in `next.config.ts` — adding a `use cache` directive without it fails at build; keep the flag.
- **v8 coverage crashes under Bun** — `node:inspector` APIs are unsupported, so `@vitest/coverage-v8` fails with "Coverage APIs are not supported". Use `bun run test:coverage` (istanbul provider, `@vitest/coverage-istanbul`); `coverage/` is gitignored and ESLint-ignored.
- **Reservation semantics:** stock is never decremented at checkout — only row-locked. Adding a decrement in the checkout handler would double-debit once the webhook runs.
- **Webhook body ordering:** the LS webhook must read the raw body via `req.text()` BEFORE any parsing; JSON-parsing first silently breaks HMAC verification.
- **camelCase convention:** all DB rows are mapped snake→camel at the API boundary; new endpoints must keep this or client types drift.
- **`ADMIN_EMAILS` is a fallback, not the source of truth** — promote users to admin by setting `role='admin'` in `better_auth."user"` (see `scripts/manage-user.ts`).
- **`better_auth` schema pool** is intentionally separate from the public pool; the auth pool sets `search_path` per connection — never reuse the public pool for auth queries.

## 10. Feature Development Workflow (Recipes for AI Agents)

### 10.1 Add a new route / page

1. Pick the route group: `(store)` public, `(auth)` public-noindex, `(user)` authed, `(admin)` admin-only.
2. Create `page.tsx` as a **Server Component**: set `metadata`/`generateMetadata`, fetch data server-side where possible (reuse cached accessors like `getLandingData`/`getCachedCategories` or direct `pool` queries), and pass `initialData` to a new `XxxClient.tsx`.
3. Create `components/feature/XxxClient.tsx` (client orchestrator) + presentational children with zero store/hook imports. Add a `loading.tsx` with a matching `*Skeleton` component.
4. If the page needs data in the client, add query hooks to `src/hooks/queries/` following the prefix key convention.
5. Protect as needed: `(user)` pages rely on the group layout gate; `(admin)` pages rely on API guards (plus `proxy.ts` edge protection).
6. Verify: `bun run lint` → `bun run test` → `bun run build`.

### 10.2 Add a new database model and expose it to the UI

1. **DDL:** add `CREATE TABLE` to `scripts/create-tables.sql` with indexes, RLS policies (public read + admin write via `requesting_user_id()` unless sensitive), triggers, and any `pg_cron` cleanup. Apply via the `setup-db.js` flow or `upload-and-seed.mts --catalog-only`.
2. **Seed:** if the data is static content, add the source array in `src/data/` and wire it into `upload-and-seed.mts` (upload images to the matching InsForge bucket; store both `original_image` and `image_url`).
3. **Read path:** add a public GET route handler in `/api/...` using `use cache` + `cacheLife` + `cacheTag` and `json_agg` for nested data; map snake→camel. Add a matching query hook with a stable prefix key.
4. **Write path (admin):** add guarded routes under `/api/admin/...` (`requireAdmin()`, `withTransaction` for multi-row writes, `logAudit()` on mutations, `revalidateTag` for affected tags), then wire CRUD into `InventoryClient`-style components with a mutation hook and query invalidation.
5. **Types:** define interfaces in the appropriate store/type location (`useAdminStore` is the type repository for admin shapes); avoid a central `types/` dir beyond the LS widget augmentation.
6. Keep this SUMMARY (§5) schema description in sync with `scripts/create-tables.sql`, and add/update tests in `__tests__/` using the `mocks.ts` helpers.

### 10.3 Add a new third-party integration

1. **Credentials:** add env vars to `.env.example` (public ones prefixed `NEXT_PUBLIC_`), keep secrets out of `next.config.ts`/client bundles, and use `requireEnv()` for mandatory server vars. If InsForge is involved, add secrets via the InsForge CLI.
2. **Client wrapper:** create a server-only module in `src/lib/` (e.g., `src/lib/lemonsqueezy.ts` style) — typed functions, lazy init, explicit failure semantics, no side effects at import time. For browser SDKs, mirror `src/lib/insforge.ts` (hook + token lifecycle) or `src/lib/auth-client.ts` (thin singleton).
3. **Hook it up:** server → call from route handlers (never pages); client → call via React Query mutations/queries. For webhooks: add `POST /api/webhooks/<provider>` that reads the raw body first, verifies signatures with `timingSafeEqual`, persists an idempotency marker (`processed_webhooks`-style table or unique constraint), and returns 500 on any unhandled failure so the provider retries.
4. **Test:** unit-test the wrapper logic and integration-test the route handler with `vi.mock` (follow `__tests__/api/` patterns).
5. **Document:** update `.env.example` and this SUMMARY (§2/§7).

---

*Maintained from research performed August 2026. This is the sole architecture reference — update it alongside the code. Style rules live in `docs/CODING_STANDARDS.md`; deployment in `docs/BACKEND_DEPLOYMENT.md`; performance rationale in `docs/performance-analysis.md`.*
