import { createHash } from "node:crypto";
import { Connection, PublicKey } from "@solana/web3.js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID ?? "7Pn6g5g88YzD5aJyCzrftCwQqCWm8bxYxPpUC2xURG2V");
const discriminator = (name: string) => createHash("sha256").update(`account:${name}`).digest().subarray(0, 8);
const POLICY_V1 = discriminator("Policy");
const POLICY_V2 = discriminator("PolicyV2");

export async function GET(request: Request) {
  const authorityValue = new URL(request.url).searchParams.get("authority");
  if (!authorityValue) return NextResponse.json({ error: "authority is required" }, { status: 400 });
  try {
    const authority = new PublicKey(authorityValue);
    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com", "confirmed");
    const [v2Address] = PublicKey.findProgramAddressSync([Buffer.from("policy_v2"), authority.toBuffer()], PROGRAM_ID);
    const [v1Address] = PublicKey.findProgramAddressSync([Buffer.from("policy"), authority.toBuffer()], PROGRAM_ID);
    const [v2Account, v1Account] = await connection.getMultipleAccountsInfo([v2Address, v1Address], "confirmed");
    if (v2Account) {
      const data = Buffer.from(v2Account.data);
      if (data.length < 87 || !data.subarray(0, 8).equals(POLICY_V2)) return NextResponse.json({ error: "Invalid V2 policy account" }, { status: 422 });
      const providerCount = data.readUInt32LE(82);
      if (providerCount > 8 || data.length < 87 + providerCount * 32) return NextResponse.json({ error: "Invalid provider vector" }, { status: 422 });
      const providers = Array.from({ length: providerCount }, (_, index) => new PublicKey(data.subarray(86 + index * 32, 118 + index * 32)).toString());
      return NextResponse.json({ exists: true, version: 2, address: v2Address.toString(), authority: new PublicKey(data.subarray(8, 40)).toString(), perCallLimitSol: Number(data.readBigUInt64LE(40)) / 1e9, dailyLimitSol: Number(data.readBigUInt64LE(48)) / 1e9, spentTodaySol: Number(data.readBigUInt64LE(56)) / 1e9, dayIndex: Number(data.readBigInt64LE(64)), maxSlippageBps: data.readUInt16LE(72), expiresAt: Number(data.readBigInt64LE(74)), allowedProviders: providers });
    }
    if (!v1Account) return NextResponse.json({ exists: false, version: 2, address: v2Address.toString(), authority: authority.toString() });
    const data = Buffer.from(v1Account.data);
    if (data.length < 73 || !data.subarray(0, 8).equals(POLICY_V1)) return NextResponse.json({ error: "Invalid V1 policy account" }, { status: 422 });
    return NextResponse.json({ exists: true, version: 1, legacy: true, address: v1Address.toString(), authority: new PublicKey(data.subarray(8, 40)).toString(), perCallLimitSol: Number(data.readBigUInt64LE(40)) / 1e9, dailyLimitSol: Number(data.readBigUInt64LE(48)) / 1e9, spentTodaySol: Number(data.readBigUInt64LE(56)) / 1e9, dayIndex: Number(data.readBigInt64LE(64)) });
  } catch {
    return NextResponse.json({ error: "Invalid authority address" }, { status: 400 });
  }
}
