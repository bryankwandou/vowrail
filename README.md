# Vowrail

Transaction firewall and proof-carrying policy rail for autonomous Solana agents.

Vowrail converts a human mandate into deterministic transaction limits, evaluates each agent intent, and records approved decisions through a deployed Solana devnet program.

## Live Components

- Public landing page with product narrative and execution flow.
- `/app` operator dashboard.
- `/studio` deterministic policy builder and transaction simulator.
- `/receipts` evidence explorer.
- `/api/evaluate` deterministic allow or deny engine.
- `/api/analyze` optional Groq explanation that cannot authorize payment.
- `/api/devnet/status` live Solana RPC health.
- `/api/verify` transaction verification.
- Anchor program with policy and decision receipt PDAs.

## Solana Devnet Proof

- Program: `7Pn6g5g88YzD5aJyCzrftCwQqCWm8bxYxPpUC2xURG2V`
- Deployment transaction: `2NShY2nhrTeksh7utbMCXj4sDLF5FDwL75MP9Acyy9KquG5ffnbeP835bUVamfra6EXPmKyuwkE6n7pJUrRJdxSk`
- Cluster: Solana devnet

The policy studio derives a policy PDA from the connected wallet, initializes or updates its limits, then creates a receipt PDA keyed by the mandate hash.

## Run Locally

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example`. Never commit wallet keys or API tokens.

## Validate

```bash
npm run typecheck
npm run lint
npm run build
anchor build
solana program show 7Pn6g5g88YzD5aJyCzrftCwQqCWm8bxYxPpUC2xURG2V --url devnet
```

## Security Boundary

Groq is restricted to operator-facing explanation. It cannot change a policy result. Wallet signing remains explicit, unknown programs default to deny, and an on-chain receipt is only created after a deterministic approval.

## License

MIT

## V2 Iteration Proof - July 24, 2026

- Program upgrade transaction: `3vDk8vhsaYMaAJtQRgT9QPbtkK773mboay76FKC6be6pQSBpaLBHaFscEaxCe69gdjyM2MQoqBF4ZzXax8zQ8T9h`
- V2 policy PDA: `4dnDNabjFFKfKgpSypne7guRvFQEosvfd49ASUyvLYz5`
- V2 receipt PDA: `nbiU3KWMD3qQrTFBHZSSGW4GbjMiWgqwvyKjB2zuVF3`
- V2 workflow transaction: `Fpf1DHzQ9ACET75j2k8KaBiPRZTQqbp48bkc7apmDgQNp8FwdvfT6oJYwyo8kDhn2wWf6CuKCFseQ6gmdETc2fN`

V2 enforces provider allowlists, policy expiry, slippage ceilings, per-call limits, and daily limits on-chain. The Checkout Lab verifies the receipt account before releasing its protected resource.
