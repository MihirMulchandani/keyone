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
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [notice, setNotice] = useState("");
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
    <div className="page">
      <h1 className="page-title">settings</h1>

      <div className="section">
        <div className="section-title">privacy</div>
        <label className="flex items-start gap-4 border-b border-[#444444] pb-6 text-[15px] leading-relaxed">
          <input className="mt-1" type="checkbox" checked={searchable} onChange={async (e) => {
            const next = e.target.checked;
            setSearchable(next);
            await supabase.from("users").update({ is_searchable: next }).eq("id", userId);
          }} />
          <span>allow others to find me by username</span>
        </label>
      </div>

      <div className="section">
        <div className="section-title">keys</div>
        <div className="space-y-5 border border-[#444444] bg-black p-5">
          <Button
            className="w-full sm:w-auto"
            onClick={async () => {
              const pk = await loadPrivateKey();
              if (pk) await downloadPrivateKeyBackup(pk);
              await trackEvent(userId, "key_exported", {});
            }}
          >
            export key backup
          </Button>
          <p className="text-[15px] leading-relaxed">
            Generating a new key pair will permanently lock you out of all existing messages. This cannot be undone.
          </p>
          <input
            className="w-full border border-[#444444] bg-black px-4 py-3 text-[15px] text-white outline-none focus:border-white"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="type confirmation text"
          />
          <Button
            className="w-full sm:w-auto"
            disabled={confirm !== "DELETE MY OLD MESSAGES"}
            onClick={async () => {
              await clearKeys();
              router.push("/onboarding");
            }}
          >
            generate new key pair
          </Button>
        </div>
      </div>

      <div className="section">
        <div className="section-title">session</div>
        <Button
          className="w-full sm:w-auto"
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

      <div className="section">
        <div className="section-title">danger zone</div>
        <div className="space-y-5 border border-[#444444] bg-black p-5">
          <p className="text-[15px] leading-relaxed">delete account and wipe all account-linked data.</p>
          <p className="small muted">type DELETE ACCOUNT to continue.</p>
          <input
            className="w-full border border-[#444444] bg-black px-4 py-3 text-[15px] text-white outline-none focus:border-white"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE ACCOUNT"
          />
          <Button
            className="w-full sm:w-auto"
            disabled={deleteConfirm !== "DELETE ACCOUNT"}
            onClick={async () => {
              setNotice("");
              const { error } = await supabase.from("users").delete().eq("id", userId);
              if (error) {
                setNotice("unable to delete account.");
                return;
              }
              await supabase.auth.signOut();
              await clearKeys();
              router.replace("/login");
            }}
          >
            delete account
          </Button>
        </div>
      </div>

      {notice ? <p className="text-[15px] leading-relaxed">{notice}</p> : null}
    </div>
  );
}
