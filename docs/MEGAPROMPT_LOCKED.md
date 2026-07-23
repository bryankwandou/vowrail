# Vowrail - Locked MVP Build Brief

**Locked name:** Vowrail  
**Meaning:** toll + notary  
**Category:** transaction firewall for autonomous agents  
**Network:** Solana devnet  
**Status date:** July 23, 2026

## Brutal Idea Audit

The original x402 gateway idea is not defensible. Payment middleware, automatic 402 retries, wallets, and quote headers are becoming commodity features. A thin gateway can be copied quickly and bypassed by direct SDK integrations. A dashboard is not a moat. An AI model deciding whether to spend is a security defect, not differentiation.

Vowrail survives only if it owns the control plane before settlement. It converts operator intent into a deterministic mandate, simulates the payment, enforces budgets and counterparty rules, records a decision receipt, and settles through an adapter such as x402. The payment rail is replaceable. The policy and evidence layer is the product.

## Final Product Thesis

Vowrail is a transaction firewall between autonomous software and paid digital services. Every paid action is checked across identity, intent, policy, simulation, and settlement proof. Groq may explain or classify a request, but it never grants payment authority.

## MVP Scope

- Interactive public site with live policy simulator.
- Operator console with budget, provider, velocity, and asset controls.
- Quote endpoint returning a mandate envelope.
- Evaluation endpoint returning allow, review, or deny.
- Solana devnet health and transaction verification endpoints.
- TypeScript integration examples.
- Anchor program for policy accounts and decision receipts.
- Public threat model, pitch deck, and hackathon submission material.

## Business Model Canvas

| Area | Locked decision |
|---|---|
| Customer | Agent platforms, API marketplaces, treasury teams |
| Pain | Agents can execute irreversible payments faster than humans can review |
| Wedge | Drop-in preflight firewall for x402 and Solana transfers |
| Value | Inspectable controls and portable settlement evidence |
| Revenue | Usage-based decisions plus team policy and retention plans |
| Distribution | Open SDK, x402 examples, hackathon integrations |
| Moat | Policy history, provider risk graph, mandate schema adoption |
| Key metric | Protected payment volume with zero policy bypasses |

## SWOT

**Strengths:** rail-agnostic control layer, direct developer utility.  
**Weaknesses:** cold-start risk data and integration friction.  
**Opportunities:** growth of machine-to-machine payments.  
**Threats:** wallet vendors adding native policy controls.

## Acceptance Gates

- Strict TypeScript production build passes.
- Secrets never enter git or client bundles.
- Devnet RPC health is visible.
- A signature can be verified against Solana devnet.
- Decisions are deterministic and testable.
- GitHub repository is public and Vercel deployment is reachable.
