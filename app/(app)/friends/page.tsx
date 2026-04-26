"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

type Friend = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "rejected";
  requester?: { username: string };
  addressee?: { username: string };
};

export default function FriendsPage() {
  const [userId, setUserId] = useState("");
  const [rows, setRows] = useState<Friend[]>([]);

  const load = async (uid: string) => {
    const { data } = await supabase
      .from("friends")
      .select("*, requester:requester_id(username), addressee:addressee_id(username)")
      .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`);
    setRows((data ?? []) as Friend[]);
  };

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setUserId(data.user.id);
      await load(data.user.id);
    };
    void run();
  }, []);

  const requests = rows.filter((row) => row.status === "pending" && row.addressee_id === userId);
  const friends = rows.filter((row) => row.status === "accepted");

  return (
    <div className="animate-in fade-in flex h-full flex-col duration-300">
      <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-border bg-background/50 px-8 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-semibold capitalize text-white">Contacts</h2>
          <p className="text-[10px] uppercase tracking-wider text-text-muted">Encrypted Directory</p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-12 overflow-y-auto p-6">
        <section>
          <h2 className="mb-4 ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-muted/80">
            Friend Requests
            {requests.length > 0 ? <span className="rounded-full bg-surface px-2 py-0.5 text-[9px] text-white">{requests.length}</span> : null}
          </h2>

          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-border bg-surface-alt p-8 text-center">
              <p className="text-sm text-text-muted">no requests.</p>
            </div>
          ) : (
            <div className="flex flex-col border border-border">
              {requests.map((row) => (
                <div key={row.id} className="flex items-center justify-between border-b border-border bg-surface p-4 last:border-b-0">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center border border-border bg-background text-xs font-bold text-white">
                      {(row.requester?.username ?? row.requester_id).slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{row.requester?.username ?? row.requester_id}</div>
                      <div className="font-mono text-xs text-text-muted">wants to connect</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-none border border-transparent p-0 hover:border-border"
                      onClick={async () => {
                        await supabase.from("friends").update({ status: "rejected" }).eq("id", row.id);
                        await load(userId);
                      }}
                    >
                      x
                    </Button>
                    <Button
                      size="icon"
                      className="h-10 w-10 rounded-none border border-transparent p-0 hover:border-border"
                      onClick={async () => {
                        await supabase.from("friends").update({ status: "accepted" }).eq("id", row.id);
                        await load(userId);
                      }}
                    >
                      ✓
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 ml-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-muted/80">
            Verified Contacts
            {friends.length > 0 ? <span className="rounded-full bg-surface px-2 py-0.5 text-[9px] text-white">{friends.length}</span> : null}
          </h2>

          {friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-border bg-surface-alt p-8 text-center">
              <p className="text-sm text-text-muted">no friends.</p>
            </div>
          ) : (
            <div className="flex flex-col border border-border">
              {friends.map((row) => {
                const username =
                  row.requester_id === userId ? row.addressee?.username ?? row.addressee_id : row.requester?.username ?? row.requester_id;
                return (
                  <div key={row.id} className="flex items-center border-b border-border bg-background p-4 transition-colors last:border-b-0 hover:bg-surface">
                    <div className="mr-4 flex h-10 w-10 items-center justify-center border border-border bg-surface text-xs font-bold text-white">
                      {username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">{username}</div>
                      <div className="mt-0.5 font-mono text-[10px] uppercase text-text-darker">ID: {row.id.slice(0, 4)}...{row.id.slice(-4)}</div>
                    </div>
                    <Link className="text-xs text-text-muted underline hover:text-white" href="/compose">
                      message
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
