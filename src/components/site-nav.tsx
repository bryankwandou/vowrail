import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "./logo";

export function SiteNav() {
  return <nav className="nav shell"><Link href="/" className="brand"><Logo/>Vowrail</Link><div className="nav-links"><a href="#product">Product</a><a href="#workflow">How it works</a><a href="#proof">Proof</a><Link className="button primary" href="/app">Open console <ArrowUpRight size={15}/></Link></div></nav>;
}
