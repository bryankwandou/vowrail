export type AgentChallenge = {
  id: string;
  provider: string;
  amountSol: number;
  asset: string;
  resource: string;
  mandateHash: string;
  expiresAt: string;
};

export type AgentPolicyInput = {
  challenge: AgentChallenge;
  spentTodaySol: number;
  perCallLimitSol: number;
  dailyLimitSol: number;
  requestedSlippageBps: number;
  maxSlippageBps: number;
  allowedProviders: string[];
  allowedAssets: string[];
  now?: number;
};

export type AgentPolicyCheck = {
  id: 'provider' | 'asset' | 'per_call' | 'daily' | 'slippage' | 'expiry';
  label: string;
  pass: boolean;
  observed: string;
  boundary: string;
};

const reasonByCheck: Record<AgentPolicyCheck['id'], string> = {
  provider: 'provider_not_allowed',
  asset: 'asset_not_allowed',
  per_call: 'per_call_limit',
  daily: 'daily_limit',
  slippage: 'slippage_limit',
  expiry: 'challenge_expired',
};

export function evaluateAgentPolicy(input: AgentPolicyInput) {
  const now = input.now ?? Date.now();
  const checks: AgentPolicyCheck[] = [
    { id: 'provider', label: 'Provider allowlist', pass: input.allowedProviders.includes(input.challenge.provider), observed: input.challenge.provider, boundary: `${input.allowedProviders.length} approved provider${input.allowedProviders.length === 1 ? '' : 's'}` },
    { id: 'asset', label: 'Settlement asset', pass: input.allowedAssets.includes(input.challenge.asset), observed: input.challenge.asset, boundary: input.allowedAssets.join(', ') },
    { id: 'per_call', label: 'Per-call ceiling', pass: input.challenge.amountSol <= input.perCallLimitSol, observed: `${input.challenge.amountSol} SOL`, boundary: `${input.perCallLimitSol} SOL` },
    { id: 'daily', label: 'Daily budget', pass: input.spentTodaySol + input.challenge.amountSol <= input.dailyLimitSol, observed: `${input.spentTodaySol + input.challenge.amountSol} SOL after approval`, boundary: `${input.dailyLimitSol} SOL` },
    { id: 'slippage', label: 'Slippage ceiling', pass: input.requestedSlippageBps <= input.maxSlippageBps, observed: `${input.requestedSlippageBps} bps`, boundary: `${input.maxSlippageBps} bps` },
    { id: 'expiry', label: 'Challenge freshness', pass: Date.parse(input.challenge.expiresAt) > now, observed: input.challenge.expiresAt, boundary: new Date(now).toISOString() },
  ];
  const failed = checks.find((check) => !check.pass);
  return { approved: !failed, reason: failed ? reasonByCheck[failed.id] : 'policy_passed', checks };
}
