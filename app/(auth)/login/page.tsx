"use client";

import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-[320px] space-y-4">
        <h1 className="text-[18px] font-medium">KeyOne</h1>
        <p className="text-xs text-[var(--text-secondary)]">end-to-end encrypted messaging</p>
        <Button
          className="w-full border-white"
          onClick={() =>
            supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: process.env.NEXT_PUBLIC_SITE_URL },
            })
          }
        >
          continue with google
        </Button>
      </div>
    </main>
  );
}
