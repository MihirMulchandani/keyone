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
      const expiresMs =
        mode === "timed" || mode === "hybrid" ? seconds * 1000 : 15 * 24 * 60 * 60 * 1000;
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
        selected.map((receiverId) =>
          trackEvent(userId, "message_sent", { delete_mode: mode, receiver_id: receiverId }),
        ),
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
    <div className="space-y-4">
      <h1 className="section-border pb-3 text-base font-medium">compose</h1>
      <div className="space-y-2">
        <p className="text-xs text-[var(--text-secondary)]">recipients (up to 20)</p>
        <div className="space-y-1">
          {friends.map((friend) => (
            <label key={friend.id} className="flex items-center gap-2 text-sm">
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
      <Textarea rows={8} maxLength={5000} value={content} onChange={(e) => setContent(e.target.value)} />
      <div className="space-y-1 text-sm">
        <label className="block">
          <input type="radio" checked={mode === "view_once"} onChange={() => setMode("view_once")} /> view once
        </label>
        <label className="block">
          <input type="radio" checked={mode === "timed"} onChange={() => setMode("timed")} /> timed
        </label>
        <label className="block">
          <input type="radio" checked={mode === "hybrid"} onChange={() => setMode("hybrid")} /> view once or timed
        </label>
        <label className="block">
          <input type="radio" checked={mode === "persistent"} onChange={() => setMode("persistent")} /> keep
        </label>
        {(mode === "timed" || mode === "hybrid") && (
          <input
            className="mt-1 w-full border border-[var(--border)] bg-transparent p-2"
            type="number"
            min={60}
            max={604800}
            value={seconds}
            onChange={(e) => setSeconds(Math.min(604800, Math.max(60, Number(e.target.value))))}
          />
        )}
      </div>
      <Button loading={loading} onClick={send}>
        send
      </Button>
      {notice ? <p>{notice}</p> : null}
    </div>
  );
}
