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
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-[420px] space-y-8">
        <div className="space-y-3">
          <h1 className="text-[22px] font-medium leading-none">KeyOne</h1>
          <p className="text-[15px] leading-relaxed text-[#cccccc]">end-to-end encrypted messaging</p>
        </div>
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
