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

export function MobileNav({ pendingRequests = 0 }: { pendingRequests?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
      <ul className="flex items-center justify-around">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex h-14 w-16 flex-col items-center justify-center rounded-2xl text-[10px] font-medium transition-all ${
                  active ? "bg-white text-black" : "text-text-muted"
                }`}
              >
                <span>{item.label}</span>
                {"key" in item && item.key === "friends" && pendingRequests > 0 ? <span>({pendingRequests})</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
