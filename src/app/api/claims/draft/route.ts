import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { groundedClaimsDraft } from "@/lib/domain";
import { createClaim } from "@/lib/mvp-store";

const requestSchema=z.object({policy_id:z.string().min(1),raw_client_statement:z.string().min(10)});
const draftSchema=z.object({date_time_of_loss:z.string(),description_of_loss:z.string(),parties_involved:z.string(),immediate_actions:z.string(),unsupported_details:z.array(z.string()),review_required:z.literal(true)});

export async function POST(request:Request){
  const parsed=requestSchema.safeParse(await request.json());
  if(!parsed.success)return NextResponse.json({error:"Policy ID and a meaningful client statement are required."},{status:400});
  let draft:Record<string,unknown>=groundedClaimsDraft(parsed.data.raw_client_statement);
  let engine="deterministic-grounded";
  if(process.env.GROQ_API_KEY){
    try{
      const groq=new Groq({apiKey:process.env.GROQ_API_KEY});
      const completion=await groq.chat.completions.create({model:process.env.GROQ_MODEL||"llama-3.3-70b-versatile",temperature:0,response_format:{type:"json_object"},messages:[{role:"system",content:"Return a JSON object for insurance claims intake using only facts in the source statement. Never infer fault, cause, extent, injury, parties, or timing. For absent facts write Not reported. Use exactly these keys: date_time_of_loss, description_of_loss, parties_involved, immediate_actions, unsupported_details, review_required. unsupported_details must be an array of strings and review_required must be true."},{role:"user",content:parsed.data.raw_client_statement}]});
      const content=completion.choices[0]?.message?.content;
      if(content){const candidate=draftSchema.safeParse(JSON.parse(content));if(candidate.success){draft=candidate.data;engine="groq-grounded"}else engine="deterministic-invalid-ai-fallback"}
    }catch{engine="deterministic-fallback"}
  }
  const claim=createClaim(parsed.data.policy_id,parsed.data.raw_client_statement,draft);
  return NextResponse.json({...claim,drafted_intake:claim.draft,engine});
}
