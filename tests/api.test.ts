import { describe, expect, it } from "vitest";
import { POST as quote } from "@/app/api/quote/route";
import { POST as evaluate } from "@/app/api/evaluate/route";
import { POST as verify } from "@/app/api/verify/route";
import { GET as demoResource } from "@/app/api/demo-resource/route";
import { GET as policy } from "@/app/api/policy/route";

const jsonRequest=(url:string,body:unknown)=>new Request(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});

describe("workflow API contracts",()=>{
  it("issues a 402 challenge with a Vowrail mandate",async()=>{const response=await quote(jsonRequest("http://test/api/quote",{agentId:"agent-1",provider:"https://provider.test/pay",resource:"risk-report",amountUsd:12,asset:"USDC"}));const data=await response.json();expect(response.status).toBe(402);expect(data.mandate.id).toMatch(/^vwr_/);expect(data.digest).toMatch(/^[a-f0-9]{64}$/)});
  it("allows a valid deterministic mandate",async()=>{const response=await evaluate(jsonRequest("http://test/api/evaluate",{mandateId:"vwr_test",provider:"https://provider.test/pay",amountUsd:12,spentTodayUsd:42,perCallLimitUsd:35,dailyLimitUsd:250,providerAllowed:true,assetAllowed:true,expiresAt:new Date(Date.now()+60_000).toISOString()}));const data=await response.json();expect(data.decision).toBe("allow");expect(data.reason).toBe("policy_passed")});
  it("denies a provider outside the allowlist",async()=>{const response=await evaluate(jsonRequest("http://test/api/evaluate",{mandateId:"vwr_test",provider:"https://provider.test/pay",amountUsd:12,providerAllowed:false,assetAllowed:true,expiresAt:new Date(Date.now()+60_000).toISOString()}));expect((await response.json()).reason).toBe("provider_not_allowed")});
  it("returns a real 402 resource challenge without a receipt",async()=>{const response=await demoResource(new Request("http://test/api/demo-resource"));expect(response.status).toBe(402);expect((await response.json()).protocol).toBe("vowrail-mandate/1")});
  it("rejects invalid verification and policy requests",async()=>{expect((await verify(jsonRequest("http://test/api/verify",{signature:"short"}))).status).toBe(400);expect((await policy(new Request("http://test/api/policy"))).status).toBe(400)});
});
