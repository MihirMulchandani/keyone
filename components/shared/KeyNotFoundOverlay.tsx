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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-6">
      <div className="w-full max-w-md space-y-4">
        <p className="text-lg">no private key found.</p>
        <p className="text-[var(--text-secondary)]">
          Your private key is stored on this device only.
          <br />
          It was not found in this browser.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => fileRef.current?.click()} loading={loading}>
            import key file
          </Button>
          <Button className="border-white" onClick={onGenerate} loading={loading}>
            generate new key pair
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
        <p className="border border-white p-2 text-sm">
          Generating a new key pair will lock you out of all existing messages.
        </p>
        {error ? <p className="text-sm">{error}</p> : null}
      </div>
    </div>
  );
}
