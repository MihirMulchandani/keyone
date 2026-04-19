"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
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
  const [pendingRequests, setPendingRequests] = useState(0);

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
      const { count } = await supabase
        .from("friends")
        .select("id", { count: "exact", head: true })
        .eq("addressee_id", user.id)
        .eq("status", "pending");
      setPendingRequests(count ?? 0);
    };
    void run();
  }, [pathname, router]);

  useEffect(() => {
    if (!userId) return;

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        void Notification.requestPermission();
      }
    }

    const channel = supabase
      .channel(`global-message-notify-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          toast("new message received.");
          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
              const notification = new Notification("KeyOne", {
                body: "you received a new message.",
              });
              notification.onclick = () => window.focus();
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1200px]">
      <Sidebar pendingRequests={pendingRequests} />
      <main className="w-full pb-14 md:pb-0">
        <div className="mx-auto w-full max-w-[760px] p-6 md:p-8">{children}</div>
      </main>
      <MobileNav pendingRequests={pendingRequests} />
      {showMissingKey && userId ? <KeyNotFoundOverlay userId={userId} /> : null}
    </div>
  );
}
