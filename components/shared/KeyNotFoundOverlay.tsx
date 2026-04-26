"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { generateKeyPair, importPrivateKeyFromText } from "@/lib/crypto/keypair";
import { saveKeyPair } from "@/lib/crypto/storage";
import { supabase } from "@/lib/supabase/client";

export function KeyNotFoundOverlay({ userId }: { userId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onImport = async (file: File) => {
    try {
      setLoading(true);
      setError("");
      const text = await file.text();
      const privateKey = await importPrivateKeyFromText(text);
      const { data } = await supabase.from("users").select("public_key").eq("id", userId).single();
      if (!data) throw new Error();
      await saveKeyPair(privateKey, data.public_key as string);
      window.location.reload();
    } catch {
      setError("unable to import key.");
    } finally {
      setLoading(false);
    }
  };

  const onGenerate = async () => {
    try {
      setLoading(true);
      setError("");
      const keyPair = await generateKeyPair();
      await supabase.from("users").update({ public_key: keyPair.publicJwk }).eq("id", userId);
      await saveKeyPair(keyPair.privateKey, keyPair.publicJwk);
      window.location.reload();
    } catch {
      setError("unable to generate key pair.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-6">
      <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6 shadow-2xl duration-500">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-danger" />
          <h3 className="text-xs font-bold uppercase tracking-tighter text-white">Security Warning</h3>
        </div>

        <p className="mb-6 text-[11px] leading-relaxed text-text-muted">
          No private key found in local storage. Messages cannot be decrypted. Please provide your master key file to continue.
        </p>

        <div className="flex flex-col gap-2">
          <Button fullWidth onClick={() => fileRef.current?.click()} loading={loading}>
            Import Key File
          </Button>
          <Button fullWidth variant="secondary" onClick={onGenerate} loading={loading}>
            Generate New Pair
          </Button>
        </div>

        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".keyone,application/json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onImport(file);
          }}
        />

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <p className="text-[10px] font-bold uppercase leading-relaxed text-danger/90">
            Generating a new pair permanently locks existing messages.
          </p>
        </div>
        {error ? <p className="mt-3 text-sm leading-relaxed text-text">{error}</p> : null}
      </div>
    </div>
  );
}
