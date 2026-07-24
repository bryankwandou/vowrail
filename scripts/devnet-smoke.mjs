import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

const endpoint = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const keypairPath = process.env.SOLANA_KEYPAIR_PATH;

if (!keypairPath) {
  throw new Error("SOLANA_KEYPAIR_PATH is required");
}

const signer = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(readFileSync(keypairPath, "utf8"))),
);
const programId = new PublicKey(
  process.env.VOWRAIL_PROGRAM_ID ?? "7Pn6g5g88YzD5aJyCzrftCwQqCWm8bxYxPpUC2xURG2V",
);
const connection = new Connection(endpoint, "confirmed");

const discriminator = (name) =>
  createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
const u64 = (value) => {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64LE(BigInt(value));
  return buffer;
};
const u16 = (value) => {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
};
const i64 = (value) => {
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64LE(BigInt(value));
  return buffer;
};
const vector = (values) => {
  const count = Buffer.alloc(4);
  count.writeUInt32LE(values.length);
  return Buffer.concat([count, ...values.map((value) => value.toBuffer())]);
};

const [policy] = PublicKey.findProgramAddressSync(
  [Buffer.from("policy_v2"), signer.publicKey.toBuffer()],
  programId,
);
const bucket = Math.floor(Date.now() / 3_600_000);
const mandate = createHash("sha256")
  .update(`vowrail-demo|${programId}|100000000|/api/demo-resource|${bucket}`)
  .digest();
const [receipt] = PublicKey.findProgramAddressSync(
  [Buffer.from("receipt_v2"), policy.toBuffer(), mandate],
  programId,
);
const allowedProviders = [
  programId,
  new PublicKey("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"),
];
const policyData = Buffer.concat([
  u64(5_000_000_000),
  u64(25_000_000_000),
  u16(50),
  i64(Math.floor(Date.now() / 1000) + 30 * 86_400),
  vector(allowedProviders),
]);
const [policyAccount, receiptAccount] = await Promise.all([
  connection.getAccountInfo(policy, "confirmed"),
  connection.getAccountInfo(receipt, "confirmed"),
]);
const transaction = new Transaction();

transaction.add(
  new TransactionInstruction({
    programId,
    keys: policyAccount
      ? [
          { pubkey: signer.publicKey, isSigner: true, isWritable: false },
          { pubkey: policy, isSigner: false, isWritable: true },
        ]
      : [
          { pubkey: signer.publicKey, isSigner: true, isWritable: true },
          { pubkey: policy, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
    data: Buffer.concat([
      discriminator(policyAccount ? "update_policy_v2" : "initialize_policy_v2"),
      policyData,
    ]),
  }),
);

if (!receiptAccount) {
  transaction.add(
    new TransactionInstruction({
      programId,
      keys: [
        { pubkey: signer.publicKey, isSigner: true, isWritable: true },
        { pubkey: policy, isSigner: false, isWritable: true },
        { pubkey: receipt, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: Buffer.concat([
        discriminator("record_decision_v2"),
        mandate,
        u64(100_000_000),
        programId.toBuffer(),
        u16(0),
      ]),
    }),
  );
}

const signature = await sendAndConfirmTransaction(connection, transaction, [signer], {
  commitment: "confirmed",
});

console.log(
  JSON.stringify(
    {
      ok: true,
      version: 2,
      network: "devnet",
      authority: signer.publicKey.toString(),
      policy: policy.toString(),
      receipt: receipt.toString(),
      provider: programId.toString(),
      receiptCreated: !receiptAccount,
      signature,
      explorer: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    },
    null,
    2,
  ),
);
