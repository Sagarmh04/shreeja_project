import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Northstar Care",
  description: "A modern member portal for managing personal care records.",
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
