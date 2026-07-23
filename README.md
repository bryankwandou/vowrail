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
