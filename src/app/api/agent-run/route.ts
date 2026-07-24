import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GET as getDemoResource } from '@/app/api/demo-resource/route';
import { evaluateAgentPolicy, type AgentChallenge } from '@/lib/agent-policy';

export const dynamic = 'force-dynamic';
const inputSchema = z.object({ spentTodaySol: z.number().min(0).default(0.7), perCallLimitSol: z.number().positive().default(0.5), dailyLimitSol: z.number().positive().default(5), requestedSlippageBps: z.number().min(0).default(20), maxSlippageBps: z.number().min(0).default(50), allowedProviders: z.array(z.string()).max(25).optional(), allowedAssets: z.array(z.string()).max(10).default(['SOL']) });

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid agent policy input', issues: parsed.error.flatten() }, { status: 400 });
  const challengeResponse = await getDemoResource(new Request(new URL('/api/demo-resource', request.url)));
  const challengePayload = await challengeResponse.json();
  if (challengeResponse.status !== 402 || !challengePayload.quote) return NextResponse.json({ error: 'The provider did not return a usable payment challenge.' }, { status: 502 });
  const challenge = challengePayload.quote as AgentChallenge;
  const policy = { ...parsed.data, allowedProviders: parsed.data.allowedProviders ?? [challenge.provider] };
  const deterministic = evaluateAgentPolicy({ challenge, ...policy });
  const normalizedIntent = { action: 'purchase_protected_resource', provider: challenge.provider, resource: challenge.resource, amountSol: challenge.amountSol, asset: challenge.asset, requestedSlippageBps: policy.requestedSlippageBps, mandateHash: challenge.mandateHash };
  let explanation = 'Deterministic checks completed. Groq is not configured in this environment.';
  let aiStatus: 'live' | 'not_configured' | 'unavailable' = 'not_configured';
  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const completion = await groq.chat.completions.create({ model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', temperature: 0.1, max_tokens: 170, messages: [{ role: 'system', content: 'Explain this autonomous payment preflight to a treasury operator in plain English. State the deterministic decision and the most important boundary. Never authorize, reverse, or soften the policy result. Maximum 80 words.' }, { role: 'user', content: JSON.stringify({ challenge, policy, deterministic }) }] });
      explanation = completion.choices[0]?.message?.content || 'Groq returned no explanation.';
      aiStatus = 'live';
    } catch { explanation = 'The deterministic decision is final. Groq was unavailable for the operator explanation.'; aiStatus = 'unavailable'; }
  }
  return NextResponse.json({ runId: `run_${crypto.randomUUID()}`, challenge, normalizedIntent, deterministic, ai: { status: aiStatus, role: 'explanation_only', explanation }, readyForWallet: deterministic.approved, nextAction: deterministic.approved ? 'connect_wallet_and_create_receipt' : 'revise_policy_or_reject_intent', evaluatedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
}
