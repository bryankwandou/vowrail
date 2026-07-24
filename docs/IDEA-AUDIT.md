# Idea Audit: Vowrail V2

## Date

July 24, 2026.

## Brutal verdict

A generic “control layer before capital moves” is no longer unique. Vishwa publicly occupies that framing, while wallet and smart-account vendors can add basic spend limits. If Vowrail stops at allowlists and caps, it becomes a feature with no distribution advantage.

The defendable direction is narrower: **proof-carrying mandates**. A decision must produce an evidence object that travels beyond the wallet and can be verified by the paid provider before it releases work. This creates a two-sided integration surface instead of another operator dashboard.

## Locked product loop

1. Provider returns a typed 402 mandate.
2. Agent submits the mandate to deterministic policy.
3. Wallet creates an approved receipt PDA.
4. Provider verifies provider, amount, policy, mandate hash, expiry, and timestamp.
5. Protected resource is released only after verification.

## Why crypto is required

The provider and operator may not trust the same database. Solana supplies a shared, low-cost evidence layer where both parties can inspect the same policy and receipt state without giving Vowrail custody.

## Business model

- Initial customer: teams running agents with real treasury authority and paid data/API dependencies.
- Wedge: receipt-gated x402 checkout adapter and policy studio.
- Revenue: hosted verification, policy templates, evidence retention, provider risk data, and team governance.
- Distribution: open provider middleware, agent SDK, wallet integrations, and public receipt explorer.
- Moat target: mandate schema adoption, provider verification integrations, and cross-provider receipt graph.

## Revised score

| Dimension | Score |
|---|---:|
| Pain severity | 93 |
| Crypto necessity | 94 |
| Differentiation | 89 |
| MVP proof | 92 |
| Distribution | 77 |
| Defensibility | 84 |
| Overall | 88 |

A score above 95 remains unjustified until independent security review, design partners, repeated paid volume, and evidence that providers will integrate receipt verification.
