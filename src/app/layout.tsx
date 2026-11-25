import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PAX — Can the airline reach you?",
  description:
    "Verify that your airline booking record contains your own contact details. Passenger-level PNR contact assurance, independently verified.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col text-slate-900 bg-slate-50">{children}</body>
    </html>
  );
}
