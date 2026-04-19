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
    <div className="page">
      <h1 className="page-title">compose</h1>

      <div className="section">
        <div className="section-title">recipients</div>
        <p className="small muted">select up to 20 accepted friends.</p>
        <div className="max-h-56 space-y-3 overflow-y-auto border border-[#444444] bg-black p-4">
          {friends.map((friend) => (
            <label key={friend.id} className="flex min-h-[44px] items-center gap-3 text-[15px] leading-none">
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

      <div className="section">
        <div className="section-title">message</div>
        <Textarea rows={10} maxLength={5000} value={content} onChange={(e) => setContent(e.target.value)} />
      </div>

      <div className="section">
        <div className="section-title">delete mode</div>
        <div className="space-y-4 border border-[#444444] bg-black p-4 text-[15px] leading-relaxed">
          <label className="flex items-start gap-3">
            <input className="mt-1" type="radio" checked={mode === "view_once"} onChange={() => setMode("view_once")} />
            <span>view once</span>
          </label>
          <label className="flex items-start gap-3">
            <input className="mt-1" type="radio" checked={mode === "timed"} onChange={() => setMode("timed")} />
            <span>timed</span>
          </label>
          <label className="flex items-start gap-3">
            <input className="mt-1" type="radio" checked={mode === "hybrid"} onChange={() => setMode("hybrid")} />
            <span>view once or timed</span>
          </label>
          <label className="flex items-start gap-3">
            <input className="mt-1" type="radio" checked={mode === "persistent"} onChange={() => setMode("persistent")} />
            <span>keep</span>
          </label>
          {(mode === "timed" || mode === "hybrid") && (
            <input
              className="w-full border border-[#444444] bg-black px-4 py-3 text-[15px] text-white outline-none focus:border-white"
              type="number"
              min={60}
              max={604800}
              value={seconds}
              onChange={(e) => setSeconds(Math.min(604800, Math.max(60, Number(e.target.value))))}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button className="w-full sm:w-auto" loading={loading} onClick={send}>
          send
        </Button>
        {notice ? <p className="text-[15px] leading-relaxed">{notice}</p> : null}
      </div>
    </div>
  );
}
