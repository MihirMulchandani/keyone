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
    <div className="animate-in fade-in flex h-full flex-col duration-300">
      <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-border bg-background/50 px-8 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-semibold capitalize text-white">Search Directory</h2>
          <p className="text-[10px] uppercase tracking-wider text-text-muted">Global Network</p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-10 overflow-y-auto p-6">
        <section className="space-y-4">
          <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-text-muted/80">Query</label>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by username..." />
          <p className="ml-1 font-mono text-[10px] uppercase text-text-muted">minimum 2 characters</p>
        </section>

        <section className="space-y-4">
          <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-text-muted/80">Results</label>
          {q.length < 2 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-border bg-surface-alt py-12 text-center">
              <p className="text-sm text-text-muted">Type to search the global directory.</p>
            </div>
          ) : (
            <div className="flex flex-col border border-border">
              {results.map((item) => (
                <div key={item.id} className="flex items-center border-b border-border bg-surface p-4 transition-colors last:border-b-0 hover:bg-surface-hover">
                  <div className="mr-4 flex h-10 w-10 items-center justify-center border border-border bg-background text-xs font-bold text-white">
                    {item.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{item.username}</div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase text-text-darker">ID: {item.id.slice(0, 4)}...{item.id.slice(-4)}</div>
                  </div>
                  <Button
                    className="h-8 rounded-none px-4 py-0 text-xs"
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
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
          {results.length === 0 && q.length >= 2 ? <p className="text-sm text-text-muted">no more results found.</p> : null}
          {status ? <p className="text-sm leading-relaxed text-text">{status}</p> : null}
        </section>
      </div>
    </div>
  );
}
