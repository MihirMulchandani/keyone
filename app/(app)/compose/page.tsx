"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { supabase } from "@/lib/supabase/client";
import { encryptMessage } from "@/lib/crypto/encrypt";
import { checkRateLimit } from "@/lib/rateLimit";
import { trackEvent } from "@/lib/events";
import type { DeleteMode } from "@/lib/supabase/types";

type Friend = { id: string; username: string; public_key: string };

export default function ComposePage() {
  const [userId, setUserId] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<DeleteMode>("persistent");
  const [seconds, setSeconds] = useState(300);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      setUserId(auth.user.id);
      const { data: friendRows } = await supabase
        .from("friends")
        .select("requester_id,addressee_id,status")
        .eq("status", "accepted")
        .or(`requester_id.eq.${auth.user.id},addressee_id.eq.${auth.user.id}`);
      const ids = (friendRows ?? []).map((row) =>
        row.requester_id === auth.user.id ? row.addressee_id : row.requester_id,
      );
      if (ids.length < 1) {
        setFriends([]);
        return;
      }
      const { data: users } = await supabase.from("users").select("id,username,public_key").in("id", ids);
      setFriends((users ?? []) as Friend[]);
    };
    void load();
  }, []);

  const send = async () => {
    if (!content.trim() || content.length > 5000 || selected.length < 1 || selected.length > 20) {
      setNotice("invalid input.");
      return;
    }
    if (!(await checkRateLimit(userId, "messages"))) {
      setNotice("slow down.");
      return;
    }
    setLoading(true);
    try {
      const expiresMs = mode === "timed" || mode === "hybrid" ? seconds * 1000 : 15 * 24 * 60 * 60 * 1000;
      const expiresAt = new Date(Date.now() + expiresMs).toISOString();

      const inserts = await Promise.all(
        selected.map(async (receiverId) => {
          const receiver = friends.find((friend) => friend.id === receiverId);
          if (!receiver) throw new Error();
          const encrypted = await encryptMessage(content, receiver.public_key);
          return {
            sender_id: userId,
            receiver_id: receiverId,
            ...encrypted,
            delete_mode: mode,
            expires_at: expiresAt,
          };
        }),
      );
      const { error } = await supabase.from("messages").insert(inserts);
      if (error) throw error;
      await Promise.all(
        selected.map((receiverId) => trackEvent(userId, "message_sent", { delete_mode: mode, receiver_id: receiverId })),
      );
      setNotice("message sent.");
      setTimeout(() => setNotice(""), 2000);
      setContent("");
    } catch {
      setNotice("unable to send message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in flex h-full flex-col duration-300">
      <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-border bg-background/50 px-8 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-semibold capitalize text-white">Compose New</h2>
          <p className="text-[10px] uppercase tracking-wider text-text-muted">Secure transmission</p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-8 overflow-y-auto p-6">
        <section className="space-y-3">
          <label className="ml-1 text-sm font-semibold text-white">Recipients</label>
          <div className="w-full border border-border bg-surface p-3">
            <div className="flex max-h-44 flex-col gap-2 overflow-y-auto">
              {friends.map((friend) => (
                <label key={friend.id} className="flex items-center gap-3 rounded-full border border-border bg-background px-3 py-2 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={selected.includes(friend.id)}
                    onChange={(event) => {
                      if (event.target.checked) setSelected((prev) => [...prev, friend.id]);
                      else setSelected((prev) => prev.filter((item) => item !== friend.id));
                    }}
                  />
                  {friend.username}
                </label>
              ))}
            </div>
          </div>
          <p className="ml-2 font-mono text-xs text-text-muted">select up to 20 accepted friends.</p>
        </section>

        <section className="space-y-3">
          <label className="ml-1 text-sm font-semibold text-white">Message</label>
          <Textarea rows={8} maxLength={5000} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Type your encrypted message here..." />
        </section>

        <section className="space-y-4">
          <label className="ml-1 text-sm font-semibold text-white">Delete Mode</label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {([
              ["view_once", "View Once", "Burns after reading"],
              ["timed", "Timed", "Lasts until timer ends"],
              ["hybrid", "View or Timed", "Whichever is first"],
              ["persistent", "Keep", "Persists securely"],
            ] as const).map(([id, label, desc]) => {
              const selectedMode = mode === id;
              return (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className={`rounded-none border p-4 text-left transition-all ${
                    selectedMode ? "border-white bg-white text-black" : "border-border bg-surface text-white hover:border-border-hover"
                  }`}
                >
                  <div className="mb-0.5 text-sm font-semibold">{label}</div>
                  <div className={`text-xs ${selectedMode ? "text-black/70" : "text-text-muted"}`}>{desc}</div>
                </button>
              );
            })}
          </div>
          {(mode === "timed" || mode === "hybrid") && (
            <input
              className="w-full border border-border bg-surface px-4 py-3 text-sm text-white outline-none transition-colors focus:border-text-muted"
              type="number"
              min={60}
              max={604800}
              value={seconds}
              onChange={(e) => setSeconds(Math.min(604800, Math.max(60, Number(e.target.value))))}
            />
          )}
        </section>

        <div className="pb-12 pt-4">
          <Button className="h-12 w-full px-8 sm:w-auto" loading={loading} onClick={send}>
            Send Encrypted
          </Button>
          {notice ? <p className="mt-3 text-sm leading-relaxed text-text">{notice}</p> : null}
        </div>
      </div>
    </div>
  );
}
