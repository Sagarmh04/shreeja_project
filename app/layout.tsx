import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "QuietLedger",
  description: "A modern privacy workspace with seamless record management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[var(--canvas)] text-[var(--brand-ink)] antialiased">
        {children}
      </body>
    </html>
  );
}
