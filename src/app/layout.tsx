import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vowrail | Transaction firewall for autonomous agents",
  description: "Deterministic payment mandates, policy enforcement, simulation, and Solana settlement evidence for autonomous software.",
  metadataBase: new URL("https://vowrail.vercel.app"),
  openGraph: {
    title: "Vowrail",
    description: "Every paid agent action passes a mandate before settlement.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
