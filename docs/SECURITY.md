# Security Review

## Threat Model

Vowrail assumes agent prompts, tool output, providers, and quotes may be hostile. The wallet owner and deployed program authority remain trusted.

## Enforced Controls

- Unknown programs default to deny.
- Per-transaction and daily limits are stored in a policy PDA.
- Receipt addresses include the policy and mandate hash, preventing duplicate receipt creation.
- Checked arithmetic prevents spend counter overflow.
- The web evaluator is deterministic and separate from Groq explanation.
- Wallet signing remains explicit in Phantom or another injected Solana wallet.
- Secrets are excluded from git and never sent to the browser.

## Known MVP Limits

- Provider reputation is not yet persisted on-chain.
- Transaction simulation currently evaluates normalized intent fields, not every arbitrary serialized instruction.
- Daily counters use UTC day buckets and do not provide rolling windows.
- The deployed program has not received an independent audit.
- Users can bypass Vowrail by signing transactions outside the integrated client.

## Verification

Program `7Pn6g5g88YzD5aJyCzrftCwQqCWm8bxYxPpUC2xURG2V` was deployed to Solana devnet with transaction `2NShY2nhrTeksh7utbMCXj4sDLF5FDwL75MP9Acyy9KquG5ffnbeP835bUVamfra6EXPmKyuwkE6n7pJUrRJdxSk`.
