"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { supabase } from "@/lib/supabase/client";
import { downloadPrivateKeyBackup, generateKeyPair } from "@/lib/crypto/keypair";
import { saveKeyPair } from "@/lib/crypto/storage";
import { trackEvent } from "@/lib/events";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [checking, setChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [userId, setUserId] = useState("");
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [publicJwk, setPublicJwk] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!USERNAME_RE.test(username)) {
        setUsernameAvailable(null);
        return;
      }
      setChecking(true);
      const { data } = await supabase.from("users").select("id").eq("username", username).maybeSingle();
      setUsernameAvailable(!data);
      setChecking(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [username]);

  const start = async () => {
    setError("");
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.replace("/login");
      return;
    }
    setUserId(data.user.id);
    if (!USERNAME_RE.test(username) || !usernameAvailable) {
      setError("invalid username.");
      return;
    }
    setStep(2);
    try {
      const pair = await generateKeyPair();
      setPrivateKey(pair.privateKey);
      setPublicJwk(pair.publicJwk);
      await saveKeyPair(pair.privateKey, pair.publicJwk);
      await supabase.from("users").insert({ id: data.user.id, username, public_key: pair.publicJwk });
      await trackEvent(data.user.id, "key_generated", {});
      setStep(3);
    } catch {
      setError("unable to finish onboarding.");
      setStep(1);
    }
  };

  if (step === 1) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-[320px] border border-border bg-surface p-6 shadow-2xl duration-500">
          <div className="mb-6 flex items-center gap-3">
            <h3 className="text-xs font-bold uppercase tracking-tighter text-white">Identity Setup</h3>
          </div>

          <p className="mb-6 text-[11px] leading-relaxed text-text-muted">
            Provide a public handle. This will be broadcasted to the discovery network.
          </p>

          <div className="space-y-4">
            <div className="relative">
              <span className="absolute top-3.5 left-4 font-mono text-sm text-text-muted">@</span>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className="pl-9 font-mono" />
            </div>
            <p className="text-xs text-text-muted">
              {checking ? "checking username..." : usernameAvailable === false ? "username is taken." : ""}
            </p>
            <Button fullWidth className="rounded-none" onClick={start}>
              Initialize Session
            </Button>
            {error ? <p className="text-sm leading-relaxed text-text">{error}</p> : null}
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-[320px] border border-border bg-surface p-6 text-center shadow-2xl">
          <div className="mx-auto mb-4 spinner" />
          <p className="text-sm leading-relaxed text-text">generating your key pair...</p>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-[420px] space-y-4 border border-border bg-surface p-6 shadow-2xl">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">key backup</h3>
          <p className="border border-border p-5 text-sm leading-relaxed text-text">
            Anyone with this file can read all your messages. Store it offline. Do not share it.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              className="w-full sm:w-auto"
              onClick={async () => {
                if (privateKey) {
                  await downloadPrivateKeyBackup(privateKey);
                  await trackEvent(userId, "key_exported", {});
                }
                setStep(4);
              }}
            >
              export backup key
            </Button>
            <button className="text-left text-sm text-text-muted underline" onClick={() => setStep(4)}>
              skip (not recommended)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 4) {
    void supabase.from("users").update({ public_key: publicJwk }).eq("id", userId);
    router.replace("/inbox");
  }
  return null;
}
