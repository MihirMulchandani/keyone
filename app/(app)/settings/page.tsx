"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
      const { data: profile } = await supabase.from("users").select("is_searchable").eq("id", data.user.id).single();
      setSearchable(Boolean(profile?.is_searchable));
    };
    void run();
  }, []);

  return (
    <div className="animate-in fade-in flex h-full flex-col duration-300">
      <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-border bg-background/50 px-8 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-semibold capitalize text-white">System Configuration</h2>
          <p className="text-[10px] uppercase tracking-wider text-text-muted">Local Policies</p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-12 overflow-y-auto p-6 pb-24">
        <section className="space-y-4">
          <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-text-muted/80">Privacy</label>
          <div className="flex items-center justify-between border border-border bg-surface-alt p-5">
            <span className="text-sm font-medium text-white">Allow others to find me by username</span>
            <label className="cursor-pointer">
              <input
                className="sr-only"
                type="checkbox"
                checked={searchable}
                onChange={async (e) => {
                  const next = e.target.checked;
                  setSearchable(next);
                  await supabase.from("users").update({ is_searchable: next }).eq("id", userId);
                }}
              />
              <span className={`flex h-5 w-10 items-center p-1 ${searchable ? "bg-white" : "bg-border"}`}>
                <span className={`h-4 w-4 bg-black transition-transform ${searchable ? "translate-x-4" : "translate-x-0"}`} />
              </span>
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-text-muted/80">Keys</label>
          <div className="space-y-3">
            <Button
              variant="secondary"
              fullWidth
              className="h-14 justify-start rounded-none border-border bg-surface-alt px-5 font-normal"
              onClick={async () => {
                const pk = await loadPrivateKey();
                if (pk) await downloadPrivateKeyBackup(pk);
                await trackEvent(userId, "key_exported", {});
              }}
            >
              Export key backup
            </Button>

            <div className="space-y-4 border border-border bg-[#111] p-5">
              <p className="text-[11px] font-medium uppercase leading-relaxed text-danger">
                Generating a new key pair will permanently lock you out of all existing messages. This cannot be undone.
              </p>
              <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="type confirmation text" />
              <Button
                variant="danger"
                fullWidth
                className="h-12 rounded-none"
                disabled={confirm !== "DELETE MY OLD MESSAGES"}
                onClick={async () => {
                  await clearKeys();
                  router.push("/onboarding");
                }}
              >
                Generate new pair
              </Button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-text-muted/80">Session</label>
          <Button
            variant="secondary"
            fullWidth
            className="h-14 rounded-none border-border bg-surface-alt"
            onClick={async () => {
              await supabase.auth.signOut();
              await clearKeys();
              await trackEvent(userId, "auth_logout", {});
              router.replace("/login");
            }}
          >
            Logout current session
          </Button>
        </section>

        <section className="mt-8 space-y-4 border-t border-danger/10 pt-8">
          <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-danger">Danger Zone</label>
          <div className="space-y-4 border border-danger/20 bg-danger-surface p-5">
            <div>
              <h4 className="mb-1 text-sm font-semibold uppercase text-danger">Delete Account</h4>
              <p className="text-[11px] leading-relaxed text-danger/80">
                Delete account and wipe all account-linked data. Type DELETE ACCOUNT to continue.
              </p>
            </div>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE ACCOUNT"
              className="border-danger/30 bg-background/50 text-danger placeholder:text-danger/30 focus:border-danger"
            />
            <Button
              variant="danger"
              fullWidth
              className="h-12 rounded-none"
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
              Purge all traces
            </Button>
          </div>
        </section>

        {notice ? <p className="text-sm leading-relaxed text-text">{notice}</p> : null}
      </div>
    </div>
  );
}
