# Hackathon Submission

## One-line Description

Vowrail is a transaction firewall that converts human spending mandates into deterministic Solana policy accounts and proof-carrying decision receipts for autonomous agents.

## Problem

Agents can already discover tools, negotiate paid APIs, and construct transactions. The missing layer is an enforceable answer to a basic operator question: did this payment still match the authority I granted?

## Solution

Vowrail checks program allowlists, per-call value, daily value, slippage, destination, and mandate expiry before wallet signing. Approved decisions are written to a receipt PDA on Solana devnet. An optional Groq service explains the result but cannot alter it.

## Why Solana

The policy and receipt state must be independently verifiable, low cost, and available to wallets, agents, providers, and auditors without trusting one application database.

## Demo Flow

1. Open Policy Studio.
2. Set a 5 SOL per-call limit and 25 SOL daily limit.
3. Submit a compliant Jupiter intent and show deterministic approval.
4. Connect Phantom on devnet.
5. Create the policy PDA and decision receipt.
6. Open the transaction on Solana Explorer.
7. Increase the intent above the cap and show the same wallet cannot create a receipt through Vowrail.

## Proof

- Program ID: `7Pn6g5g88YzD5aJyCzrftCwQqCWm8bxYxPpUC2xURG2V`
- Deployment signature: `2NShY2nhrTeksh7utbMCXj4sDLF5FDwL75MP9Acyy9KquG5ffnbeP835bUVamfra6EXPmKyuwkE6n7pJUrRJdxSk`
- Public repository: `bryankwandou/vowrail`
- Live deployment: `vowrail.vercel.app`

## Honest Limit

This MVP is not an audited custody system. It proves the policy and evidence architecture on devnet and leaves wallet signing non-custodial.
