import Link from "next/link";
import { ArrowRight, CheckCircle2, FileCheck2, ShieldCheck, Siren, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const proofPoints = [
  ["01", "Requirements become gates", "Vowrail checks the exact documents, attestations, photos, and prior-coverage proof configured for each policy type."],
  ["02", "Exceptions become evidence", "An override is narrow, role-gated, justified, and permanently separated from an ordinary bind."],
  ["03", "Renewals become a pipeline", "Scheduled outreach is logged at each interval, with unresolved policies escalated before silence becomes a lapse."],
];

export default function Home() {
  return <main>
    <nav className="nav shell"><BrandMark/><div className="nav-links"><a href="#product">Product</a><a href="#controls">Controls</a><a href="#proof">Proof</a></div><Link className="button button-small" href="/dashboard">Open workspace <ArrowRight size={15}/></Link></nav>
    <section className="hero shell">
      <div className="eyebrow"><span className="live-dot"/> Binding integrity for independent agencies</div>
      <h1>A policy should never bind on <em>“we probably have it.”</em></h1>
      <p className="hero-copy">Vowrail turns pre-bind requirements into enforced controls, renewal follow-up into an accountable pipeline, and claims notes into grounded drafts staff can trust.</p>
      <div className="hero-actions"><Link className="button" href="/dashboard">Explore the live workspace <ArrowRight size={17}/></Link><a className="text-link" href="#product">See how the controls work</a></div>
      <div className="hero-board" aria-label="Vowrail operational control preview">
        <div className="board-top"><span>Bind control / HO-3 renewal</span><span className="status status-blocked">Blocked correctly</span></div>
        <div className="board-grid"><div className="check-stack"><div className="mini-label">Readiness evidence</div><div className="check-row complete"><CheckCircle2 size={19}/> Signed application <span>verified</span></div><div className="check-row complete"><CheckCircle2 size={19}/> Prior coverage <span>verified</span></div><div className="check-row missing"><span className="empty-check"/> Roof inspection photos <strong>required</strong></div><button className="disabled-button" disabled>Bind policy</button></div><div className="signal-panel"><div className="signal-icon"><ShieldCheck size={27}/></div><div><span className="mini-label">Decision</span><strong>1 mandatory item missing</strong><p>The status transition is rejected server-side until proof is recorded or a Principal documents an exception.</p></div><div className="audit-line"><span>Audit fingerprint</span><code>7d4f…b91a</code></div></div></div>
      </div>
    </section>
    <section id="product" className="section shell"><div className="section-heading"><span className="kicker">The operating system for the risky moments</span><h2>Controls where agency memory is not enough.</h2></div><div className="feature-grid"><article className="feature-card featured"><div className="feature-icon"><ShieldCheck/></div><span>Pre-bind control</span><h3>Stop coverage gaps before the binder leaves.</h3><p>Requirements are evaluated against the policy type at the transition point—not from a checklist someone can ignore.</p><Link href="/bind-request/POL-1048">Open bind review <ArrowRight size={16}/></Link></article><article className="feature-card"><div className="feature-icon amber"><Siren/></div><span>Renewal protection</span><h3>Make silence visible.</h3><p>Every outreach interval is logged. Unanswered policies move into an at-risk queue before expiration.</p><Link href="/renewals">View pipeline <ArrowRight size={16}/></Link></article><article className="feature-card"><div className="feature-icon violet"><FileCheck2/></div><span>Claims consistency</span><h3>Draft from the client’s words, not invented facts.</h3><p>Structured intake keeps unknown details marked unknown and requires staff confirmation before filing.</p><Link href="/claims/CLM-209">Review a draft <ArrowRight size={16}/></Link></article></div></section>
    <section id="controls" className="dark-section"><div className="shell proof-layout"><div><span className="kicker light">Designed for defensible operations</span><h2>Every consequential action leaves a trail.</h2><p>Vowrail separates routine fulfillment from exceptional authority. Append-only evidence, role checks, and cryptographic fingerprints make the record useful when the agency needs to explain what happened.</p><Link className="button button-light" href="/dashboard">Inspect the control center <ArrowRight size={17}/></Link></div><div className="ledger-card"><div className="ledger-head"><Sparkles size={18}/> Evidence ledger</div>{["Requirement fulfilled", "Bind block evaluated", "Principal override reviewed", "Renewal outreach logged"].map((item,index)=><div className="ledger-row" key={item}><span className="ledger-number">0{index+1}</span><div><strong>{item}</strong><small>{index===2?"No override applied":"Signed and timestamped"}</small></div><code>{["31c9","aa82","—","9fe0"][index]}</code></div>)}</div></div></section>
    <section id="proof" className="section shell"><div className="section-heading"><span className="kicker">A disciplined sequence</span><h2>From requirement to defensible decision.</h2></div><div className="steps">{proofPoints.map(([n,title,body])=><article key={n}><span>{n}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>
    <section className="cta shell"><div><span className="kicker">Built for the agency principal</span><h2>Know what is blocked, what is at risk, and why.</h2></div><Link className="button" href="/dashboard">Enter Vowrail <ArrowRight size={17}/></Link></section>
    <footer className="footer shell"><BrandMark/><p>Binding integrity. Claims discipline. Renewal accountability.</p><span>© 2026 Vowrail</span></footer>
  </main>;
}
