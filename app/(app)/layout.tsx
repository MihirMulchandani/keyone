"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";
import { MobileNav } from "@/components/shared/MobileNav";
import { KeyNotFoundOverlay } from "@/components/shared/KeyNotFoundOverlay";
import { loadPrivateKey } from "@/lib/crypto/storage";
import { supabase } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/events";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [showMissingKey, setShowMissingKey] = useState(false);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);
      await trackEvent(user.id, "auth_login", {});
      const key = await loadPrivateKey();
      setShowMissingKey(!key && pathname !== "/onboarding");
    };
    void run();
  }, [pathname, router]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1200px]">
      <Sidebar />
      <main className="w-full pb-14 md:pb-0">
        <div className="mx-auto w-full max-w-[720px] p-4">{children}</div>
      </main>
      <MobileNav />
      {showMissingKey && userId ? <KeyNotFoundOverlay userId={userId} /> : null}
    </div>
  );
}
