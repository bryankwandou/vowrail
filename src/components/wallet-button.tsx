"use client";
import { useState } from "react";
import { Wallet } from "lucide-react";
type Provider={connect():Promise<{publicKey:{toString():string}}>};

export function WalletButton({onConnected}:{onConnected?:(key:string)=>void}) {
  const [key,setKey]=useState("");
  const connect=async()=>{const provider=(window as unknown as {solana?:Provider}).solana;if(!provider){window.open("https://phantom.app/","_blank","noopener,noreferrer");return}const result=await provider.connect();const next=result.publicKey.toString();setKey(next);onConnected?.(next)};
  return <button className="button" onClick={connect}><Wallet size={15}/>{key?`${key.slice(0,4)}...${key.slice(-4)}`:"Connect devnet wallet"}</button>;
}
