import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Northern Star Audit Portal",
  description: "Employee and audit management portal for Northern Star.",
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
