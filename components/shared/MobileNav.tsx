"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/inbox", label: "inbox" },
  { href: "/compose", label: "compose" },
  { href: "/friends", label: "friends" },
  { href: "/settings", label: "settings" },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-[var(--border)] bg-black md:hidden">
      <ul className="grid grid-cols-4">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex min-h-11 items-center justify-center text-xs ${pathname === item.href ? "text-white" : "text-[var(--text-secondary)]"}`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
