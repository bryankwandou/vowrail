import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, FileWarning, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { renewals } from "@/lib/demo-data";

export default function DashboardPage() {
  const decisions = [
    ["POL-1048", "Rina Patel", "1 item missing", "Jon Bell"],
    ["POL-1062", "Westward Dental", "Ready to bind", "Nora Ames"],
    ["POL-1067", "Samuel Wright", "2 items missing", "Jon Bell"],
  ];
  const events = [
    ["10:42", "Prior coverage verified", "POL-1048 · Nora Ames"],
    ["09:18", "30-day renewal call logged", "POL-7314 · Elise Ward"],
    ["08:04", "Scheduled renewal sweep completed", "18 policies evaluated"],
  ];
  return <AppShell active="Dashboard"><main className="workspace">
    <div className="workspace-head"><div><span className="kicker">Friday, July 24, 2026</span><h1>Good morning, Amelia.</h1><p>Three decisions need attention before the agency closes today.</p></div><Link className="button" href="/bind-request/POL-1048">Review bind queue <ArrowRight size={16}/></Link></div>
    <div className="metric-grid"><Metric icon={<FileWarning/>} value="3" label="Bind requests blocked" tone="red"/><Metric icon={<AlertTriangle/>} value="2" label="Renewals at risk" tone="amber"/><Metric icon={<Clock3/>} value="4" label="Claims awaiting review" tone="violet"/><Metric icon={<CheckCircle2/>} value="96.8%" label="Clean bind rate" tone="green"/></div>
    <div className="dashboard-grid">
      <section className="panel span-two"><div className="panel-head"><div><span className="mini-label">Priority queue</span><h2>Binding decisions</h2></div><Link href="/bind-request/POL-1048">View all <ArrowRight size={15}/></Link></div><div className="table"><div className="table-row table-title"><span>Policy</span><span>Client</span><span>Readiness</span><span>Owner</span></div>{decisions.map((row,index)=><Link href="/bind-request/POL-1048" className="table-row" key={row[0]}><span><ShieldCheck size={17}/>{row[0]}</span><strong>{row[1]}</strong><span className={`status ${index===1?"status-good":"status-blocked"}`}>{row[2]}</span><span>{row[3]}</span></Link>)}</div></section>
      <section className="panel"><div className="panel-head"><div><span className="mini-label">Renewal watch</span><h2>Closest to lapse</h2></div><Link href="/renewals"><ArrowRight size={17}/></Link></div>{renewals.slice(0,3).map(item=><div className="renewal-mini" key={item.id}><div><strong>{item.client}</strong><span>{item.line}</span></div><span className={`risk risk-${item.risk}`}>{item.days<0?"Expired":`${item.days}d`}</span></div>)}</section>
      <section className="panel span-two"><div className="panel-head"><div><span className="mini-label">Control activity</span><h2>Evidence ledger</h2></div><span className="status status-good">Devnet ready</span></div><div className="timeline">{events.map(item=><div key={item[0]}><time>{item[0]}</time><i/><p><strong>{item[1]}</strong><span>{item[2]}</span></p></div>)}</div></section>
      <section className="panel risk-panel"><AlertTriangle/><span className="mini-label">Principal review</span><h2>Override rate rose to 3.2%</h2><p>Two overrides this month cite delayed inspection evidence. Review the carrier exception pattern before it becomes routine.</p><button className="text-link">Open governance report</button></section>
    </div>
  </main></AppShell>;
}

function Metric({icon,value,label,tone}:{icon:React.ReactNode;value:string;label:string;tone:string}) {
  return <article className="metric"><div className={`metric-icon ${tone}`}>{icon}</div><div><strong>{value}</strong><span>{label}</span></div></article>;
}
