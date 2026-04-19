"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/inbox", label: "inbox" },
  { href: "/compose", label: "compose" },
  { href: "/friends", label: "friends" },
  { href: "/search", label: "search" },
  { href: "/settings", label: "settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[220px] border-r border-[var(--border)] md:block">
      <nav className="p-4">
        <div className="mb-6 text-sm font-medium">KeyOne</div>
        <ul className="space-y-1">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  className={`block rounded-[2px] px-2 py-2 text-sm transition-colors ${active ? "border border-white bg-white text-black" : "border border-transparent text-white hover:border-white hover:bg-white hover:text-black"}`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
