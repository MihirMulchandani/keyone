"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { decryptMessage, DecryptionError } from "@/lib/crypto/decrypt";
import { supabase } from "@/lib/supabase/client";
import { useRealtime } from "@/lib/hooks/useRealtime";
import type { MessageRow } from "@/lib/supabase/types";
import { trackEvent } from "@/lib/events";

export default function InboxPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [opened, setOpened] = useState<MessageRow | null>(null);
  const [decrypted, setDecrypted] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  useRealtime(userId);

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      setUserId(auth.user.id);
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("receiver_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setMessages((data ?? []) as MessageRow[]);
    };
    void load();
  }, []);

  const destroyMessage = useCallback(
    async (message: MessageRow, reason: "view_once" | "timed" | "expired" | "manual") => {
      await supabase.from("messages").delete().eq("id", message.id);
      if (userId) await trackEvent(userId, "message_deleted", { message_id: message.id, reason });
      setOpened(null);
      setDecrypted("");
    },
    [userId],
  );

  useEffect(() => {
    if (!opened) return;
    if (opened.delete_mode === "timed" || opened.delete_mode === "hybrid" || opened.delete_mode === "persistent") {
      const tick = setInterval(() => {
        const remaining = Math.max(0, Math.floor((new Date(opened.expires_at).getTime() - Date.now()) / 1000));
        setCountdown(remaining);
      }, 1000);
      return () => clearInterval(tick);
    }
  }, [destroyMessage, opened]);

  useEffect(() => {
    if (!opened) return;
    const timeoutMs = new Date(opened.expires_at).getTime() - Date.now();
    const timer = setTimeout(() => void destroyMessage(opened, "timed"), Math.max(0, timeoutMs));

    const onVisibility = () => {
      if (document.hidden && (opened.delete_mode === "view_once" || opened.delete_mode === "hybrid")) {
        void destroyMessage(opened, "view_once");
      }
    };
    const onUnload = () => {
      if (opened.delete_mode === "view_once" || opened.delete_mode === "hybrid") {
        void destroyMessage(opened, "view_once");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [destroyMessage, opened]);

  const rows = useMemo(() => messages, [messages]);

  if (opened) {
    return (
      <div className="animate-in fade-in flex h-full flex-col duration-300">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-border bg-background/50 px-8 backdrop-blur-md">
          <div>
            <h2 className="text-lg font-semibold capitalize text-white">Message</h2>
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Secure view</p>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-4 overflow-y-auto p-6">
          <p className="font-mono text-sm leading-relaxed">FROM: {opened.sender_id}</p>
          <p className="font-mono text-sm leading-relaxed">MODE: {opened.delete_mode}</p>
          <div className="whitespace-pre-wrap border-y border-border py-6 font-mono text-sm leading-relaxed">{decrypted}</div>
          {countdown !== null ? <p className="text-xs text-text-muted">deletes in {countdown}s</p> : null}
          <p className="text-sm leading-relaxed text-text">This message will self-destruct when you leave this view.</p>
          <button className="text-left text-sm underline" onClick={() => void destroyMessage(opened, "manual")}>
            destroy now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in flex h-full flex-col duration-300">
      <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-border bg-background/50 px-8 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-semibold capitalize text-white">Encrypted Inbox</h2>
          <p className="text-[10px] uppercase tracking-wider text-text-muted">Zero-Knowledge verified</p>
        </div>
      </header>

      <div className="w-full flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center bg-surface-alt p-8 text-center">
            <h3 className="mb-2 text-lg font-medium text-white">no messages.</h3>
            <p className="max-w-xs text-sm text-text-muted">Your encrypted inbox is empty. Start a secure conversation.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {rows.map((message) => (
              <button
                key={message.id}
                className="cursor-pointer border-b border-border p-6 text-left transition-colors hover:bg-surface-hover"
                onClick={async () => {
                  try {
                    const plaintext = await decryptMessage(message);
                    setOpened(message);
                    setDecrypted(plaintext);
                    await supabase.from("messages").update({ is_opened: true, opened_at: new Date().toISOString() }).eq("id", message.id);
                    if (userId) await trackEvent(userId, "message_opened", { message_id: message.id });
                  } catch (err) {
                    if (err instanceof DecryptionError) {
                      setError(
                        "unable to decrypt this message.\n\nThis message may have been encrypted with a different key,\nor your key may have changed since it was sent.",
                      );
                    } else setError("unable to decrypt this message.");
                  }
                }}
              >
                <div className="mb-1 flex items-start justify-between">
                  <span className="flex items-center gap-2 text-sm font-bold text-white">
                    {!message.is_opened ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                    {message.sender_id.slice(0, 8)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-text-darker">{new Date(message.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs text-text-muted">Encrypted payload...</p>
              </button>
            ))}
          </div>
        )}
        {error ? <pre className="whitespace-pre-wrap p-6 text-sm leading-relaxed text-text">{error}</pre> : null}
      </div>
    </div>
  );
}
