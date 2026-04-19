"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/inbox", label: "inbox" },
  { href: "/compose", label: "compose" },
  { href: "/friends", label: "friends", key: "friends" },
  { href: "/search", label: "search" },
  { href: "/settings", label: "settings" },
];

export function Sidebar({ pendingRequests = 0 }: { pendingRequests?: number }) {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-[220px] shrink-0 border-r border-[#444444] bg-black md:block">
      <nav className="p-6">
        <Link
          href="/"
          className="mb-10 block rounded-[2px] border border-transparent px-2 py-2 text-lg font-medium leading-none transition-colors hover:border-white hover:bg-white hover:text-black"
        >
          KeyOne
        </Link>
        <ul className="space-y-3">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  className={`block rounded-[2px] px-3 py-3 text-[15px] leading-none transition-colors ${active ? "border border-white bg-white text-black" : "border border-transparent text-white hover:border-white hover:bg-white hover:text-black"}`}
                  href={item.href}
                >
                  {item.label}
                  {"key" in item && item.key === "friends" && pendingRequests > 0
                    ? ` [new:${pendingRequests}]`
                    : ""}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
