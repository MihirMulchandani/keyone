"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { clearKeys, loadPrivateKey } from "@/lib/crypto/storage";
import { downloadPrivateKeyBackup } from "@/lib/crypto/keypair";
import { trackEvent } from "@/lib/events";

export default function SettingsPage() {
  const [searchable, setSearchable] = useState(true);
  const [userId, setUserId] = useState("");
  const [confirm, setConfirm] = useState("");
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setUserId(data.user.id);
      const { data: profile } = await supabase
        .from("users")
        .select("is_searchable")
        .eq("id", data.user.id)
        .single();
      setSearchable(Boolean(profile?.is_searchable));
    };
    void run();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="section-border pb-3 text-base font-medium">settings</h1>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={searchable}
          onChange={async (e) => {
            const next = e.target.checked;
            setSearchable(next);
            await supabase.from("users").update({ is_searchable: next }).eq("id", userId);
          }}
        />
        allow others to find me by username
      </label>
      <div className="space-y-2">
        <Button
          onClick={async () => {
            const pk = await loadPrivateKey();
            if (pk) await downloadPrivateKeyBackup(pk);
            await trackEvent(userId, "key_exported", {});
          }}
        >
          export key backup
        </Button>
      </div>
      <div className="space-y-2 border border-white p-2">
        <p className="text-sm">
          Generating a new key pair will permanently lock you out of all existing messages. This cannot be undone.
        </p>
        <input
          className="w-full border border-[var(--border)] bg-transparent p-2"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="type confirmation text"
        />
        <Button
          disabled={confirm !== "DELETE MY OLD MESSAGES"}
          onClick={async () => {
            await clearKeys();
            router.push("/onboarding");
          }}
        >
          generate new key pair
        </Button>
      </div>
      <Button
        onClick={async () => {
          await supabase.auth.signOut();
          await clearKeys();
          await trackEvent(userId, "auth_logout", {});
          router.replace("/login");
        }}
      >
        logout
      </Button>
    </div>
  );
}
