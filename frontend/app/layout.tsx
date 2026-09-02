import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evalora - AI Technical Assessment & Interview Simulation Platform",
  description: "B2B AI-driven interview simulation, RAG knowledge base grounding, and HR assessment reporting.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
