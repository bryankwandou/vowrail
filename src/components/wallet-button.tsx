'use client';
import { useState } from 'react';
import { CheckCircle2, LoaderCircle, Wallet } from 'lucide-react';

type Provider = { connect(): Promise<{ publicKey: { toString(): string } }> };

export function WalletButton({ onConnected }: { onConnected?: (key: string) => void }) {
  const [key, setKey] = useState('');
  const [state, setState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const connect = async () => {
    const provider = (window as unknown as { solana?: Provider }).solana;
    if (!provider) { window.open('https://phantom.app/', '_blank', 'noopener,noreferrer'); return; }
    setState('connecting');
    try {
      const result = await provider.connect();
      const next = result.publicKey.toString();
      setKey(next); setState('connected'); onConnected?.(next);
    } catch { setState('error'); }
  };
  const label = state === 'connecting' ? 'Connecting wallet' : key ? `${key.slice(0, 4)}...${key.slice(-4)}` : state === 'error' ? 'Retry wallet connection' : 'Connect devnet wallet';
  return <button className='button wallet-button' onClick={connect} disabled={state === 'connecting'} data-wallet-state={state} aria-label={label}>{state === 'connecting' ? <LoaderCircle className='spin' size={15} /> : state === 'connected' ? <CheckCircle2 size={15} /> : <Wallet size={15} />}<span>{label}</span>{state === 'connected' && <small>Phantom · devnet flow</small>}</button>;
}
