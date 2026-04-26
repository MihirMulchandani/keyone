"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/inbox", label: "Inbox" },
  { href: "/compose", label: "Compose" },
  { href: "/friends", label: "Friends", key: "friends" },
  { href: "/search", label: "Search" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar({ pendingRequests = 0 }: { pendingRequests?: number }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-border bg-sidebar px-6 py-8 md:flex">
      <div className="space-y-12">
        <Link href="/inbox" className="block">
          <h1 className="mb-1 font-serif text-2xl italic tracking-tight text-white">KeyOne</h1>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-darker">Secure Communications</p>
        </Link>

        <nav className="space-y-6">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 transition-colors ${active ? "text-white" : "text-text-muted hover:text-white"}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${active ? "bg-white" : "border border-[#444] group-hover:border-white"}`}
                />
                <span className="text-sm font-medium">
                  {item.label}
                  {"key" in item && item.key === "friends" && pendingRequests > 0 ? ` (${pendingRequests})` : ""}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border-hover bg-surface text-[10px] font-bold text-white">
          K1
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-xs font-semibold text-white">session active</p>
          <p className="truncate text-[10px] text-text-darker">encrypted relay online</p>
        </div>
      </div>
    </aside>
  );
}
