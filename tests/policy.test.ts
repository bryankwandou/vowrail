import { describe, expect, it } from 'vitest';
import { evaluateIntent, hashPolicy, type Policy } from '@/lib/policy';
import { evaluateAgentPolicy, type AgentChallenge } from '@/lib/agent-policy';

const policy: Policy = { name: 'Treasury', maxSol: 5, maxSlippageBps: 50, dailyLimitSol: 25, allowedPrograms: ['jupiter'], blockedDestinations: ['blocked'] };

describe('deterministic policy', () => {
  it('approves an intent inside every boundary', () => { const result = evaluateIntent(policy, { amountSol: 2.4, slippageBps: 35, program: 'jupiter', destination: 'safe' }); expect(result.approved).toBe(true); expect(result.checks.every((check) => check.pass)).toBe(true); });
  it.each([
    [{ amountSol: 6, slippageBps: 35, program: 'jupiter', destination: 'safe' }, 'Per-transaction ceiling'],
    [{ amountSol: 2, slippageBps: 80, program: 'jupiter', destination: 'safe' }, 'Slippage ceiling'],
    [{ amountSol: 2, slippageBps: 20, program: 'unknown', destination: 'safe' }, 'Program allowlist'],
    [{ amountSol: 2, slippageBps: 20, program: 'jupiter', destination: 'blocked' }, 'Destination blocklist'],
  ])('blocks a violated boundary', (intent, rule) => { const result = evaluateIntent(policy, intent); expect(result.approved).toBe(false); expect(result.checks.find((check) => check.rule === rule)?.pass).toBe(false); });
  it('produces a stable SHA-256 policy hash', async () => { expect(await hashPolicy(policy)).toMatch(/^[a-f0-9]{64}$/); expect(await hashPolicy(policy)).toBe(await hashPolicy(policy)); });
});

const challenge: AgentChallenge = { id: 'vwr_live', provider: 'VowrailProvider', amountSol: 0.1, asset: 'SOL', resource: '/api/demo-resource', mandateHash: 'a'.repeat(64), expiresAt: new Date(Date.now() + 60_000).toISOString() };
const agentInput = { challenge, spentTodaySol: 0.7, perCallLimitSol: 0.5, dailyLimitSol: 5, requestedSlippageBps: 20, maxSlippageBps: 50, allowedProviders: ['VowrailProvider'], allowedAssets: ['SOL'] };

describe('agent preflight policy', () => {
  it('allows a fresh challenge inside every treasury boundary', () => { const result = evaluateAgentPolicy(agentInput); expect(result.approved).toBe(true); expect(result.reason).toBe('policy_passed'); expect(result.checks).toHaveLength(6); });
  it('blocks before wallet access when a boundary fails', () => { const result = evaluateAgentPolicy({ ...agentInput, allowedProviders: [] }); expect(result.approved).toBe(false); expect(result.reason).toBe('provider_not_allowed'); });
  it('rejects an expired challenge', () => { const result = evaluateAgentPolicy({ ...agentInput, now: Date.now() + 120_000 }); expect(result.reason).toBe('challenge_expired'); });
});
