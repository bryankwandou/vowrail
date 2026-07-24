import Link from "next/link";
import { FlaskConical, LayoutDashboard, ReceiptText, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Logo } from "./logo";

const links = [["/app","Overview",LayoutDashboard],["/studio","Policy studio",SlidersHorizontal],["/lab","Checkout lab",FlaskConical],["/receipts","Receipts",ReceiptText],["/","Product site",ShieldCheck]] as const;

export function AppShell({children,active}:{children:React.ReactNode;active:string}) {
  return <div className="app-shell"><aside className="sidebar"><Link href="/" className="brand"><Logo light/>Vowrail</Link><div className="side-links">{links.map(([href,label,Icon])=><Link className={active===href?"active":""} href={href} key={href}><Icon size={16}/>{label}</Link>)}</div><div className="side-foot"><b>Devnet workspace</b><br/>Policies stay local until you anchor a receipt with your wallet.</div></aside><main className="main">{children}</main></div>;
}
