# ProfitDon — Deployment Plan (portable, host-independent)

Status: plan only. Nothing in this snapshot is deployed by committing it.
Prices are NOT finalized. DON thresholds are DRAFT only. No live data
provider is connected in this snapshot.

## Intended architecture

- **Source of truth:** GitHub — Darknezz-0/ProfitDon, main branch.
- **Hosting (initial choice):** Vercel, for application hosting and backend services.
- **Database and authentication:** an existing Supabase project, independent
  of the hosting provider. Moving hosts must not move or lose Supabase data.
- **Subscriptions and payments:** Stripe, future. Test mode first, live only
  after prices are approved.
- **Domain:** GoDaddy, separate from the host. The domain is not bought
  through the host, so leaving a host does not mean losing the domain.

## Portability rules

- Do not use host-specific databases, storage, authentication, cron, or queues.
  No Cloudflare D1/KV/Workers bindings, and no Vercel Blob/Postgres/Edge-only
  features, in the portable core.
- Business logic (profit, margin, ROI, break-even, max buy, DON Score) lives
  in a plain module (`profit-engine.js` in this snapshot), not inside a
  host-specific function.
- Each data provider gets its own adapter: it takes a product identifier in
  and returns one standard product record out. The rest of the app never
  depends on a provider's raw format, so swapping providers swaps one adapter.
- Secrets live only as server-side environment variables on the host.
  Never in front-end code, public files, `.env` files committed to GitHub,
  screenshots, or chat.

## Environment variables (names only — no values in this repo)

Server-side only (never prefixed for browser exposure):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (browser-safe key for the Supabase client; still
  protected by Row-Level Security, never a service-role key)
- `SUPABASE_SERVICE_ROLE_KEY` (server only, never in front-end code)
- `STRIPE_SECRET_KEY` (server only; test key first, live key only after approval)
- `STRIPE_WEBHOOK_SECRET` (server only, set after the webhook endpoint exists)
- `DATA_PROVIDER_API_KEY` (server only; only after a provider is chosen,
  its terms checked, and its cost per request known)
- `DATA_PROVIDER_BASE_URL` (server only)

Public / build-time (only if the host requires them, and only non-secret):
- `NEXT_PUBLIC_SUPABASE_URL` / `VITE_SUPABASE_URL` — use only the anon key
  pattern the chosen framework requires, and only with RLS enforced.

## Vercel preparation (steps, in order, each needing approval where noted)

1. Connect Vercel via its own sign-in page (no token in chat). Vercel is
   currently not connected in Muse; this step is not done by this snapshot.
2. Import the GitHub repository (Darknezz-0/ProfitDon) as a Vercel project.
3. Set the framework / build command / output directory for the real app
   (this static snapshot needs no build; the full app will).
4. Set the environment variables above in Vercel, with approval for each
   change. Never paste a secret into chat or into a GitHub file.
5. Deploy to a Vercel preview URL first. Check the deployment URL, build
   logs, and runtime logs before calling anything live.
6. Test the full flow on the preview URL: sign in, Analyzer, Deal Vault,
   and (once enabled) Stripe test checkout and webhook in test mode.
7. Only after approval: point the GoDaddy domain to Vercel using the DNS
   records Vercel provides (A / CNAME as instructed by Vercel), set the
   Supabase redirect URLs to the live domain, and re-test sign-in on the
   live domain. GoDaddy DNS changes are manual in GoDaddy (no connector).

## Moving to Cloudflare or another host later

1. Deploy the same GitHub code to the new host.
2. Set the same environment variable names on the new host.
3. Test on the new host's temporary URL, including sign-in (Supabase
   redirect URLs) and, once live, Stripe webhooks (new webhook endpoint).
4. Lower DNS time-to-live, point the GoDaddy domain to the new host,
   verify, then turn off the old host.
5. Supabase data and GitHub code do not move in this switch, so customer
   data is not lost by changing hosts — provided no host-specific data
   store was used, per the portability rules above.

## Supabase connection — what is still needed

- The exact Supabase project (name / project ref) — not identified by name
  in this snapshot; the owner must name it.
- Whether its tables, Auth settings, and Row-Level Security policies
  already exist from the original build, or must be created by migration.
- RLS verification: a signed-in user must only see their own deals,
  analyses, sellers, observations, progress, and settings.
- There is no ready-made Supabase connector in Muse, so this part is a
  custom secure connection plus Supabase dashboard steps, not one-click.

## Stripe — future, test first

- Connect Stripe via its own OAuth page (currently not connected in Muse).
- Create products/prices only after final prices are approved.
- Webhook endpoint must be on a public host (Vercel preview/live), not on
  a Muse artifact, which has no public link.
- Handle successful payments, failed payments, cancellations, and sync
  subscription status to Supabase server-side, never from browser values.
