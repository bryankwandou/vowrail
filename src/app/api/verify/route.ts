import { Connection } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ signature: z.string().min(40).max(100) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  try {
    const connection = new Connection(endpoint, "confirmed");
    const transaction = await connection.getParsedTransaction(parsed.data.signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
    if (!transaction) return NextResponse.json({ verified: false, reason: "transaction_not_found" }, { status: 404 });
    return NextResponse.json({ verified: transaction.meta?.err == null, slot: transaction.slot, feeLamports: transaction.meta?.fee ?? null, blockTime: transaction.blockTime, error: transaction.meta?.err ?? null });
  } catch {
    return NextResponse.json({ verified: false, reason: "rpc_error" }, { status: 502 });
  }
}
