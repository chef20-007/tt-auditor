import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TT Auditor",
  description: "Ticket Tree account auditor",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
