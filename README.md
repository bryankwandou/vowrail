# Vowrail

Vowrail is an operational control platform for independent insurance agencies. It prevents a policy from binding while mandatory evidence is missing, keeps renewal silence visible, and turns raw claim statements into grounded drafts that require staff review.

## Product controls

- Server-side pre-bind readiness evaluation and a narrow, justified Principal override path.
- Append-only fulfillment, override, and audit records enforced by database triggers and grants.
- Scheduled, idempotent renewal outreach with explicit lapse-risk escalation.
- Claims intake drafting that preserves unknown facts and never silently adds cause or fault.
- Optional Groq drafting and Solana devnet connectivity for external evidence anchoring.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The product workspace is available at `/dashboard`.

## Validate

```bash
npm run lint
npm run type-check
npm test
npm run build
```

## Database

Apply `supabase/migrations/202607230001_vowrail_foundation.sql` to a Supabase project. The migration includes tenant-aware RLS, a bind-transition trigger, and immutable evidence controls.

## Environment

See `.env.example`. The deterministic claims path works without an AI key. Set `GROQ_API_KEY` to enable the external grounded drafting path. Keep all service-role and cron credentials server-only.
