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
      <div className="page">
        <h1 className="page-title">onboarding</h1>
        <div className="section">
          <div className="section-title">username</div>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
          <p className="small muted">
            {checking ? "checking username..." : usernameAvailable === false ? "username is taken." : ""}
          </p>
          <Button className="w-full sm:w-auto" onClick={start}>
            continue
          </Button>
          {error ? <p className="text-[15px] leading-relaxed">{error}</p> : null}
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="page">
        <h1 className="page-title">onboarding</h1>
        <div className="flex items-center gap-4">
          <span className="spinner" />
          <p className="text-[15px] leading-relaxed">generating your key pair...</p>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="page">
        <h1 className="page-title">key backup</h1>
        <div className="section">
          <p className="border border-[#444444] p-5 text-[15px] leading-relaxed">
            Anyone with this file can read all your messages. Store it offline. Do not share it.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
            <button className="text-left text-[15px] text-[#cccccc] underline" onClick={() => setStep(4)}>
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
