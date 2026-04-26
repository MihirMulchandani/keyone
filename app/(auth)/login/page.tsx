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
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-text">
      <div className="animate-in fade-in zoom-in-95 flex w-full max-w-sm flex-col items-center text-center duration-500">
        <div className="mb-8 flex h-16 w-16 items-center justify-center border border-border bg-surface shadow-2xl">
          <span className="font-mono text-lg text-white">K1</span>
        </div>

        <h1 className="mb-2 font-serif text-3xl italic tracking-tight text-white">KeyOne</h1>
        <p className="mb-12 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">Secure Communications</p>

        <Button
          fullWidth
          className="h-12"
          onClick={() =>
            supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
              },
            })
          }
        >
          Authenticate Session
        </Button>

        <p className="mt-8 max-w-[260px] text-[11px] uppercase text-text-muted/60">Zero-trust verification enforced.</p>
      </div>
    </main>
  );
}
