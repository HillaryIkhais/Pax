import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CashCase — ATM debited, no cash",
  description:
    "Evidence-checked bank complaint and correctly timed CBN escalation for ATM cash-dispense errors. Bank-first, status-verified.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col text-slate-900 bg-slate-50">{children}</body>
    </html>
  );
}
