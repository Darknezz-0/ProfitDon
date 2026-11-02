# ProfitDon — Rebuild Snapshot (Partial)

This is a portable snapshot of the ProfitDon rebuild created in Muse on 2026-11-02.
It is a backup of the rebuild, not the original Replit application, and not a
1:1 export of the Muse fullstack artifact's internal server code. That artifact
code is not exposed as files, so this snapshot captures the verified core logic,
branding, and deployment plan in portable, host-independent form.

## What this snapshot contains

- `index.html` — a static, portable front end for the Opportunity Analyzer,
  Profit Calculator, Deal Vault (browser storage in this snapshot), and Academy
  module list. No live marketplace data.
- `profit-engine.js` — the verified calculation engine: net profit, margin, ROI,
  break-even price, maximum buy cost, and DON Score.
- `docs/DEPLOYMENT.md` — hosting, environment variables, and deployment plan
  for Vercel, with portability notes for Cloudflare or another host.
- `.gitignore` — never commit `.env` or secrets.

## Branding

Money green and metallic gold on black / dark green. Slogan:
"Build Your Empire. Profit Like A Don."
Logo concept: 'Profit' in green with a money pattern, 'Don' in gold.

## Important: not finalized

- Subscription prices are NOT finalized. Tier cards in the Muse build are
  shown under a PRICING NOT FINALIZED banner. Do not charge users based on
  any price in this snapshot.
- DON Advisor BUY / CAUTION / PASS thresholds are DRAFT only:
  BUY 70, CAUTION 45, with weights ROI 35%, Margin 30%, Fee Efficiency 20%,
  Price Buffer 15%. They are owner-editable and must not be treated as final.
- No live marketplace data provider is connected in this snapshot.
  Results are from numbers the user enters, labeled manual, and are
  recommendations only, not guarantees. They are not financial advice.

## Verified examples

- $90 sale - $53 cost - $19 fees = $18 net, ROI 33.96%, Margin 20%,
  break-even $72, max buy $50.71 at a 40% target ROI.
- $120 sale / $60 buy / 15% referral / $8 fulfillment = $34 net,
  56.7% ROI, $80 break-even, CAUTION (DRAFT), Low confidence
  when no product identifier or fee confirmation is supplied.
  Note on DON Score: the Muse artifact's internal scoring gave 61 for this
  example. This portable snapshot engine uses the same weights
  (35/30/20/15) and draft thresholds (70/45) and lands in the same CAUTION
  (DRAFT) band, but its documented component formulas are an approximation
  and do not reproduce the artifact's exact 61 score. Do not present the
  snapshot score as the artifact's score.

## Architecture (intended, portable)

- GitHub is the source of truth.
- Vercel for hosting and backend services (initial choice).
- Supabase for database and authentication (independent of the host).
- Stripe for subscriptions and payments (future, test mode first).
- GoDaddy for the domain (separate from the host).
- Avoid host-specific databases, storage, auth, cron, or queues, so the
  platform can move to Cloudflare or another host without rebuilding.
- API integrations use a provider adapter: one module per provider that
  returns a standard product record. Business logic never depends on a
  provider's raw format.
- Secrets live only as server-side environment variables on the host,
  never in front-end code, public files, or this repository.
