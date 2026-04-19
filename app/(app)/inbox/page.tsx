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
      <div className="page">
        <h1 className="page-title">message</h1>
        <div className="section">
          <p className="font-mono text-[15px] leading-relaxed">FROM: {opened.sender_id}</p>
          <p className="font-mono text-[15px] leading-relaxed">MODE: {opened.delete_mode}</p>
          <div className="border-y border-[#444444] py-6 font-mono text-[15px] leading-relaxed whitespace-pre-wrap">
            {decrypted}
          </div>
          {countdown !== null ? <p className="small muted">deletes in {countdown}s</p> : null}
          <p className="text-[15px] leading-relaxed">
            This message will self-destruct when you leave this view.
          </p>
          <button className="text-left text-[15px] underline" onClick={() => void destroyMessage(opened, "manual")}>
            destroy now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">inbox</h1>
      {rows.length === 0 ? <p className="muted py-2 text-[15px]">no messages.</p> : null}
      {rows.map((message) => (
        <button
          key={message.id}
          className="row"
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
          <span className="font-mono text-[15px]">{message.sender_id.slice(0, 8)}</span>
          <span className="small muted">{new Date(message.created_at).toLocaleTimeString()}</span>
        </button>
      ))}
      {error ? <pre className="whitespace-pre-wrap text-[15px] leading-relaxed">{error}</pre> : null}
    </div>
  );
}
