import { Connection } from "@solana/web3.js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const startedAt = performance.now();
  try {
    const connection = new Connection(endpoint, "confirmed");
    const [slot, version] = await Promise.all([connection.getSlot(), connection.getVersion()]);
    return NextResponse.json({ network: "devnet", online: true, slot, version, latencyMs: Math.round(performance.now() - startedAt) });
  } catch {
    return NextResponse.json({ network: "devnet", online: false, latencyMs: Math.round(performance.now() - startedAt) }, { status: 503 });
  }
}
