"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        router.replace("/");
      }
    };
    void run();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-[320px] space-y-4">
        <h1 className="text-[18px] font-medium">KeyOne</h1>
        <p className="text-xs text-[#cccccc]">end-to-end encrypted messaging</p>
        <Button
          className="w-full border-white"
          onClick={() =>
            supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
              },
            })
          }
        >
          continue with google
        </Button>
      </div>
    </main>
  );
}
