"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { checkRateLimit } from "@/lib/rateLimit";

type UserResult = { id: string; username: string };

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ""));
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (q.length < 2 || !userId) return;
      if (!(await checkRateLimit(userId, "search"))) {
        setStatus("slow down.");
        return;
      }
      const { data } = await supabase
        .from("users")
        .select("id,username")
        .ilike("username", `%${q}%`)
        .eq("is_searchable", true)
        .neq("id", userId)
        .limit(20);
      setResults((data ?? []) as UserResult[]);
    }, 400);
    return () => clearTimeout(timer);
  }, [q, userId]);

  return (
    <div className="page">
      <h1 className="page-title">search</h1>

      <div className="section">
        <div className="section-title">query</div>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search by username..." />
        <p className="small muted">minimum 2 characters.</p>
      </div>

      <div className="section">
        <div className="section-title">results</div>
        {results.map((item) => (
          <div key={item.id} className="row">
            <span className="text-[15px]">{item.username}</span>
            <Button
              onClick={async () => {
                if (!(await checkRateLimit(userId, "friend_requests"))) {
                  setStatus("slow down.");
                  return;
                }
                const { error } = await supabase
                  .from("friends")
                  .insert({ requester_id: userId, addressee_id: item.id, status: "pending" });
                setStatus(error ? "unable to send request." : "request sent.");
              }}
            >
              add
            </Button>
          </div>
        ))}
        {results.length === 0 && q.length >= 2 ? <p className="muted text-[15px]">no more results found.</p> : null}
        {status ? <p className="text-[15px] leading-relaxed">{status}</p> : null}
      </div>
    </div>
  );
}
