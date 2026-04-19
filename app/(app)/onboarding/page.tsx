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
      <div className="space-y-4">
        <h1 className="text-base font-medium">onboarding</h1>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
        <p className="text-xs text-[var(--text-secondary)]">
          {checking ? "checking username..." : usernameAvailable === false ? "username is taken." : ""}
        </p>
        <Button onClick={start}>continue</Button>
        {error ? <p className="text-sm">{error}</p> : null}
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex items-center gap-2">
        <span className="spinner" />
        <p>generating your key pair...</p>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="space-y-4">
        <p className="border border-white p-2 text-sm">
          Anyone with this file can read all your messages. Store it offline. Do not share it.
        </p>
        <div className="flex gap-3">
          <Button
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
          <button className="text-xs text-[var(--text-secondary)]" onClick={() => setStep(4)}>
            skip (not recommended)
          </button>
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
