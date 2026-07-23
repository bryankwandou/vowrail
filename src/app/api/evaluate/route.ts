import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  mandateId: z.string().min(5),
  provider: z.string().url(),
  amountUsd: z.number().positive(),
  spentTodayUsd: z.number().min(0).default(0),
  perCallLimitUsd: z.number().positive().default(35),
  dailyLimitUsd: z.number().positive().default(250),
  providerAllowed: z.boolean().default(false),
  assetAllowed: z.boolean().default(true),
  expiresAt: z.string().datetime(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid mandate", issues: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  const checks = {
    provider: input.providerAllowed,
    asset: input.assetAllowed,
    perCall: input.amountUsd <= input.perCallLimitUsd,
    daily: input.spentTodayUsd + input.amountUsd <= input.dailyLimitUsd,
    expiry: Date.parse(input.expiresAt) > Date.now(),
  };
  const passed = Object.values(checks).every(Boolean);
  const reason = !checks.provider ? "provider_not_allowed" : !checks.asset ? "asset_not_allowed" : !checks.perCall ? "per_call_limit" : !checks.daily ? "daily_limit" : !checks.expiry ? "mandate_expired" : "policy_passed";
  const decision = { mandateId: input.mandateId, decision: passed ? "allow" : "deny", reason, checks, evaluatedAt: new Date().toISOString() };
  const receiptHash = createHash("sha256").update(JSON.stringify(decision)).digest("hex");
  return NextResponse.json({ ...decision, receiptHash });
}
