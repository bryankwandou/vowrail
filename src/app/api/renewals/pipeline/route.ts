import{NextResponse}from"next/server";import{renewalSnapshot,runRenewalSweep}from"@/lib/mvp-store";
export const dynamic="force-dynamic";
function authorized(request:Request){return Boolean(process.env.CRON_SECRET)&&request.headers.get("authorization")===`Bearer ${process.env.CRON_SECRET}`}
export async function GET(request:Request){if(authorized(request))return NextResponse.json({...runRenewalSweep(),idempotent:true,trigger:"scheduled_cron",completed_at:new Date().toISOString()});return NextResponse.json({policies:renewalSnapshot(),generated_at:new Date().toISOString()})}
export async function POST(request:Request){if(process.env.CRON_SECRET&&!authorized(request))return NextResponse.json({error:"Unauthorized"},{status:401});return NextResponse.json({...runRenewalSweep(),idempotent:true,trigger:"manual",completed_at:new Date().toISOString()})}
