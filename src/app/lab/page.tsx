'use client';
import { useState } from 'react';
import { ArrowRight, Bot, Check, CheckCircle2, Copy, KeyRound, LockKeyhole, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { HoverLift, Reveal } from '@/components/motion';

type Quote = { id: string; provider: string; amountSol: number; resource: string; expiresAt: string };
type Unlock = { resource: { dataset: string; records: number; checksum: string }; evidence: { version: number; receipt: string; policy: string; amountSol: number } };
type Run = { runId: string; challenge: Quote; deterministic: { approved: boolean; checks: { id: string; label: string; pass: boolean; observed: string; boundary: string }[] }; ai: { status: string; explanation: string }; readyForWallet: boolean };

export default function CheckoutLab() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [receipt, setReceipt] = useState('');
  const [result, setResult] = useState<Unlock | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');
  const call = async (kind: string, path: string, init?: RequestInit) => {
    setLoading(kind); setError('');
    try { const response = await fetch(path, { cache: 'no-store', ...init }); const data = await response.json(); return { response, data }; }
    catch { setError('The live workflow is unavailable.'); return null; }
    finally { setLoading(''); }
  };
  const requestQuote = async () => { const output = await call('quote', '/api/demo-resource'); if (!output) return; setQuote(output.data.quote ?? null); if (output.response.status !== 402) setError('The provider did not return HTTP 402.'); };
  const runAgent = async () => { setRun(null); const output = await call('agent', '/api/agent-run', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }); if (!output) return; if (!output.response.ok) setError(output.data.error ?? 'Agent preflight failed.'); else { setRun(output.data); setQuote(output.data.challenge); } };
  const unlock = async () => { setResult(null); const output = await call('verify', '/api/demo-resource', { headers: { 'x-vowrail-receipt': receipt.trim() } }); if (!output) return; if (!output.response.ok) setError(`${output.data.error ?? 'verification_failed'}. Create a fresh receipt in Policy Studio.`); else setResult(output.data); };

  return <AppShell active='/lab'>
    <div className='topbar'><div><h1>Checkout lab</h1><p>Run the challenge, policy, explanation, receipt, and release workflow.</p></div><span className='badge'>HTTP 402 + Solana devnet</span></div>
    <Reveal><section className='card agent-preflight'><div><span className='eyebrow'>Live agent preflight</span><h2>Inspect the payment before a wallet can sign it.</h2><p>Vowrail fetches a current challenge, applies deterministic limits, then asks Groq to explain the outcome. Groq cannot change the decision.</p><button className='button primary' onClick={runAgent} disabled={Boolean(loading)}><Bot size={16}/>{loading === 'agent' ? 'Running policy trace' : 'Run agent preflight'}</button></div><aside className='agent-state' data-agent-state={run ? (run.readyForWallet ? 'ready' : 'blocked') : 'idle'}><ShieldCheck size={30}/><b>{run ? (run.readyForWallet ? 'Ready for wallet' : 'Blocked before wallet') : 'No intent inspected'}</b><small>{run?.runId ?? 'A run ID will bind the trace.'}</small></aside></section></Reveal>
    {run && <Reveal><section className='agent-trace' aria-label='Agent policy trace'><header><div><span className='eyebrow'>Deterministic decision</span><h2>{run.deterministic.approved ? 'Policy passed' : 'Policy blocked the intent'}</h2></div><strong className={run.deterministic.approved ? 'pass' : 'fail'}>{run.deterministic.approved ? 'ALLOW' : 'DENY'}</strong></header><div className='trace-checks'>{run.deterministic.checks.map((check, index) => <HoverLift key={check.id}><article className={check.pass ? 'pass' : 'fail'}><span>{String(index + 1).padStart(2, '0')}</span>{check.pass ? <Check size={17}/> : <X size={17}/>}<div><b>{check.label}</b><span>{check.observed}</span><small>Boundary: {check.boundary}</small></div></article></HoverLift>)}</div><div className='ai-explanation'><div><Bot size={19}/><span>Groq operator explanation</span><b data-ai-status={run.ai.status}>{run.ai.status.toUpperCase()}</b></div><p>{run.ai.explanation}</p><small>Explanation only. Deterministic policy remains final.</small></div></section></Reveal>}
    <div className='lab-grid'><Reveal><section className='card lab-step'><span className='step-number'>01</span><LockKeyhole size={24}/><h2>Request protected data</h2><p>The endpoint withholds its payload and returns provider, price, resource, network, and expiry.</p><button className='button primary' onClick={requestQuote} disabled={Boolean(loading)}>{loading === 'quote' ? 'Requesting' : 'Send unpaid request'}<ArrowRight size={15}/></button>{quote && <div className='quote-box'><Item label='HTTP status' value='402 Payment Required'/><Item label='Amount' value={`${quote.amountSol} SOL`}/><Item label='Provider' value={quote.provider}/><Item label='Expires' value={new Date(quote.expiresAt).toLocaleTimeString()}/></div>}</section></Reveal><Reveal delay={0.08}><section className='card lab-step'><span className='step-number'>02</span><KeyRound size={24}/><h2>Present a receipt</h2><p>Create an approved devnet receipt in Policy Studio, then paste its PDA here.</p><label className='field'><span>Receipt PDA</span><input value={receipt} onChange={(event) => setReceipt(event.target.value)} placeholder='DhWJ...VzP7'/></label><button className='button signal' onClick={unlock} disabled={Boolean(loading) || receipt.trim().length < 32}>{loading === 'verify' ? 'Verifying' : 'Verify and unlock'}<RefreshCw size={15}/></button>{error && <div className='notice danger'>{error}</div>}</section></Reveal></div>
    {result && <Reveal><section className='card unlock-result'><div className='unlock-head'><div><span className='eyebrow'>Access granted / receipt V{result.evidence.version}</span><h2>Receipt accepted. Resource released.</h2></div><CheckCircle2 size={38}/></div><div className='receipt-grid'><Item label='Dataset' value={result.resource.dataset}/><Item label='Records' value={String(result.resource.records)}/><Item label='Checksum' value={result.resource.checksum}/><Item label='Receipt' value={result.evidence.receipt}/><Item label='Policy' value={result.evidence.policy}/><Item label='Paid' value={`${result.evidence.amountSol} SOL`}/></div><button className='button small' onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}><Copy size={14}/>Copy proof bundle</button></section></Reveal>}
  </AppShell>;
}

function Item({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><b className='mono'>{value}</b></div>; }
