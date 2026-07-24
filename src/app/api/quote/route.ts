import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  agentId: z.string().min(3).max(80),
  provider: z.string().url(),
  resource: z.string().min(1).max(200),
  amountUsd: z.number().positive().max(10_000),
  asset: z.string().default("USDC"),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid quote request", issues: parsed.error.flatten() }, { status: 400 });
  const issuedAt = new Date();
  const mandate = {
    id: `vwr_${randomUUID()}`,
    ...parsed.data,
    network: "solana-devnet",
    nonce: randomUUID(),
    issuedAt: issuedAt.toISOString(),
    expiresAt: new Date(issuedAt.getTime() + 90_000).toISOString(),
  };
  const digest = createHash("sha256").update(JSON.stringify(mandate)).digest("hex");
  return NextResponse.json({ mandate, digest, policyEndpoint: "/api/evaluate" }, { status: 402 });
}
