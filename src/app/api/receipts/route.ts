import { createHash } from "node:crypto";
import { Connection, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID ?? "7Pn6g5g88YzD5aJyCzrftCwQqCWm8bxYxPpUC2xURG2V");
const discriminator = (name: string) => createHash("sha256").update(`account:${name}`).digest().subarray(0, 8);
const RECEIPT_V1 = discriminator("DecisionReceipt");
const RECEIPT_V2 = discriminator("DecisionReceiptV2");

export async function GET() {
  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com", "confirmed");
  try {
    const [v2Accounts, v1Accounts] = await Promise.all([
      connection.getProgramAccounts(PROGRAM_ID, { commitment: "confirmed", filters: [{ memcmp: { offset: 0, bytes: bs58.encode(RECEIPT_V2) } }] }),
      connection.getProgramAccounts(PROGRAM_ID, { commitment: "confirmed", filters: [{ memcmp: { offset: 0, bytes: bs58.encode(RECEIPT_V1) } }] }),
    ]);
    const decoded = [...v2Accounts, ...v1Accounts].flatMap(({ pubkey, account }) => {
      const data = Buffer.from(account.data);
      const version = data.subarray(0, 8).equals(RECEIPT_V2) ? 2 : data.subarray(0, 8).equals(RECEIPT_V1) ? 1 : 0;
      if (!version || data.length < (version === 2 ? 123 : 121)) return [];
      return [{
        address: pubkey.toString(),
        version,
        policy: new PublicKey(data.subarray(8, 40)).toString(),
        mandateHash: data.subarray(40, 72).toString("hex"),
        provider: new PublicKey(data.subarray(72, 104)).toString(),
        amountLamports: data.readBigUInt64LE(104).toString(),
        amountSol: Number(data.readBigUInt64LE(104)) / 1e9,
        slippageBps: version === 2 ? data.readUInt16LE(112) : null,
        recordedAt: Number(data.readBigInt64LE(version === 2 ? 114 : 112)),
        signature: null,
        slot: null,
      }];
    }).sort((left, right) => right.recordedAt - left.recordedAt).slice(0, 50);
    return NextResponse.json({ network: "solana-devnet", programId: PROGRAM_ID.toString(), count: decoded.length, v2Count: decoded.filter((receipt) => receipt.version === 2).length, receipts: decoded }, { headers: { "Cache-Control": "s-maxage=15, stale-while-revalidate=60" } });
  } catch (error) {
    return NextResponse.json({ error: "Unable to read receipt accounts", detail: error instanceof Error ? error.message : "Unknown RPC error" }, { status: 502 });
  }
}
