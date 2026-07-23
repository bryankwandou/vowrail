"use client";

import { useMemo, useState } from "react";
import { Buffer } from "buffer";
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { CheckCircle2, CircleDollarSign, Gauge, ListChecks, Network, Send, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { WalletButton } from "@/components/wallet-button";
import { evaluateIntent, hashPolicy, type Policy } from "@/lib/policy";

const JUPITER = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";
const MEMO = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID ?? "7Pn6g5g88YzD5aJyCzrftCwQqCWm8bxYxPpUC2xURG2V");

type Provider = {
  publicKey?: PublicKey;
  connect(): Promise<{ publicKey: PublicKey }>;
  signAndSendTransaction(transaction: Transaction): Promise<{ signature: string }>;
};

function joinBytes(...parts: Uint8Array[]) {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}

function u64(value: number) {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigUint64(0, BigInt(value), true);
  return bytes;
}

async function discriminator(name: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`global:${name}`));
  return new Uint8Array(digest).slice(0, 8);
}

async function hexToBytes(value: string) {
  return Uint8Array.from(value.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
}

export default function Studio() {
  const [wallet, setWallet] = useState("");
  const [name, setName] = useState("Treasury operator mandate");
  const [maxSol, setMaxSol] = useState(5);
  const [slippage, setSlippage] = useState(50);
  const [daily, setDaily] = useState(25);
  const [amount, setAmount] = useState(2.4);
  const [intentSlippage, setIntentSlippage] = useState(35);
  const [program, setProgram] = useState(JUPITER);
  const [result, setResult] = useState("Run the simulator to inspect this intent against the active mandate.");
  const [decision, setDecision] = useState<boolean | null>(null);
  const [signature, setSignature] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const policy: Policy = useMemo(() => ({ name, maxSol, maxSlippageBps: slippage, dailyLimitSol: daily, allowedPrograms: [JUPITER, MEMO], blockedDestinations: [] }), [name, maxSol, slippage, daily]);

  const simulate = async () => {
    const evaluation = evaluateIntent(policy, { amountSol: amount, slippageBps: intentSlippage, program, destination: "" });
    const hash = await hashPolicy(policy);
    setDecision(evaluation.approved);
    setResult([`DECISION  ${evaluation.approved ? "APPROVE" : "BLOCK"}`, `POLICY    ${hash}`, "", ...evaluation.checks.map((check) => `${check.pass ? "PASS" : "FAIL"}  ${check.rule.padEnd(26)} ${check.detail}`)].join("\n"));
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ policy, intent: { amountSol: amount, slippageBps: intentSlippage, program } }) });
      const data = await response.json();
      setAnalysis(data.analysis || "");
    } catch { setAnalysis("Deterministic checks completed. The optional explanation service is unavailable."); }
  };

  const anchor = async () => {
    if (decision !== true) { setResult("Only an approved deterministic decision can create an on-chain receipt."); return; }
    const provider = (window as unknown as { solana?: Provider }).solana;
    if (!provider) { setResult("Install Phantom, switch to Solana devnet, then connect the wallet."); return; }
    setSubmitting(true);
    try {
      const connected = provider.publicKey ? { publicKey: provider.publicKey } : await provider.connect();
      const authority = connected.publicKey;
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com", "confirmed");
      const [policyPda] = PublicKey.findProgramAddressSync([new TextEncoder().encode("policy"), authority.toBytes()], PROGRAM_ID);
      const mandateHex = await hashPolicy({ ...policy, name: `${policy.name}:${amount}:${intentSlippage}:${program}` });
      const mandateBytes = await hexToBytes(mandateHex);
      const [receiptPda] = PublicKey.findProgramAddressSync([new TextEncoder().encode("receipt"), policyPda.toBytes(), mandateBytes], PROGRAM_ID);
      const transaction = new Transaction();
      const policyExists = await connection.getAccountInfo(policyPda);
      const perCallLamports = Math.round(maxSol * 1_000_000_000);
      const dailyLamports = Math.round(daily * 1_000_000_000);

      if (!policyExists) {
        transaction.add(new TransactionInstruction({
          programId: PROGRAM_ID,
          keys: [
            { pubkey: authority, isSigner: true, isWritable: true },
            { pubkey: policyPda, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          data: Buffer.from(joinBytes(await discriminator("initialize_policy"), u64(perCallLamports), u64(dailyLamports))),
        }));
      } else {
        transaction.add(new TransactionInstruction({
          programId: PROGRAM_ID,
          keys: [
            { pubkey: authority, isSigner: true, isWritable: false },
            { pubkey: policyPda, isSigner: false, isWritable: true },
          ],
          data: Buffer.from(joinBytes(await discriminator("update_policy"), u64(perCallLamports), u64(dailyLamports))),
        }));
      }

      transaction.add(new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: authority, isSigner: true, isWritable: true },
          { pubkey: policyPda, isSigner: false, isWritable: true },
          { pubkey: receiptPda, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.from(joinBytes(await discriminator("record_decision"), mandateBytes, u64(Math.round(amount * 1_000_000_000)), new PublicKey(program).toBytes())),
      }));

      transaction.feePayer = authority;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const sent = await provider.signAndSendTransaction(transaction);
      setSignature(sent.signature);
      setWallet(authority.toString());
      setResult(`${result}\n\nONCHAIN   receipt ${receiptPda.toString()}\nPROGRAM   ${PROGRAM_ID.toString()}`);
    } catch (error) {
      setResult(`${result}\n\nSUBMIT ERROR  ${error instanceof Error ? error.message : "Unknown wallet error"}`);
    } finally { setSubmitting(false); }
  };

  return <AppShell active="/studio"><div className="topbar"><div><h1>Policy studio</h1><p>Compile a mandate, test an intent, then write the approved decision to the Vowrail program on devnet.</p></div><WalletButton onConnected={setWallet}/></div><div className="studio-grid"><section className="card"><div className="panel-title"><h2>Human mandate</h2><span className="badge">Default deny</span></div><div className="field"><label>Policy name</label><input value={name} onChange={(event) => setName(event.target.value)} /></div><div className="field"><label>Maximum value per transaction</label><input type="number" min="0" step="0.1" value={maxSol} onChange={(event) => setMaxSol(Number(event.target.value))} /></div><div className="field"><label>Daily value ceiling</label><input type="number" min="0" value={daily} onChange={(event) => setDaily(Number(event.target.value))} /></div><div className="field"><label>Maximum slippage in basis points</label><input type="number" min="0" value={slippage} onChange={(event) => setSlippage(Number(event.target.value))} /></div><div className="rule-builder"><div className="rule"><ListChecks size={17} />Unknown programs are blocked</div><div className="rule"><CircleDollarSign size={17} />Native SOL outflow is capped</div><div className="rule"><Gauge size={17} />Slippage is checked before signature</div><div className="rule"><Network size={17} />Receipts use program {PROGRAM_ID.toString().slice(0, 8)}...</div></div></section><section className="card"><div className="panel-title"><h2>Intent simulator</h2><span className="mono">{wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : "NO WALLET"}</span></div><div className="field"><label>Requested amount in SOL</label><input type="number" min="0" step="0.1" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></div><div className="field"><label>Requested slippage in bps</label><input type="number" min="0" value={intentSlippage} onChange={(event) => setIntentSlippage(Number(event.target.value))} /></div><div className="field"><label>Program</label><select value={program} onChange={(event) => setProgram(event.target.value)}><option value={JUPITER}>Jupiter v6</option><option value={MEMO}>Solana Memo</option><option value="11111111111111111111111111111111">System program - not allowlisted</option></select></div><div className="hero-actions" style={{ marginTop: 0, marginBottom: 14 }}><button className="button primary" onClick={simulate}><ShieldAlert size={15} />Simulate intent</button><button className="button signal" disabled={decision !== true || submitting} onClick={anchor}><Send size={15} />{submitting ? "Submitting" : "Create devnet receipt"}</button></div><div className="sim-output">{result}</div>{analysis && <div className="notice" style={{ marginTop: 12 }}><b>Operator explanation</b><br />{analysis}</div>}{signature && <div className="notice" style={{ marginTop: 12 }}><CheckCircle2 size={15} /> Receipt confirmed: <a className="mono" target="_blank" rel="noreferrer" href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}>{signature.slice(0, 18)}...</a></div>}</section></div></AppShell>;
}
