import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "DataHarvest",
  description: "AI-powered structured data extraction",
};

function Nav() {
  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-8 px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          DataHarvest
        </Link>
        <div className="flex gap-6 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-gray-900">Dashboard</Link>
          <Link href="/jobs/new" className="hover:text-gray-900">New Job</Link>
          <Link href="/templates" className="hover:text-gray-900">Templates</Link>
          <Link href="/settings" className="hover:text-gray-900">Settings</Link>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
