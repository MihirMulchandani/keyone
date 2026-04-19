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

export function MobileNav({ pendingRequests = 0 }: { pendingRequests?: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-[#444444] bg-black md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex min-h-[48px] items-center justify-center border-r border-[#444444] text-xs ${pathname === item.href ? "text-white" : "text-[#cccccc]"}`}
            >
              {item.label}
              {"key" in item && item.key === "friends" && pendingRequests > 0
                ? ` [${pendingRequests}]`
                : ""}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
