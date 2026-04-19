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
    <div className="space-y-8">
      <h1 className="section-border pb-3 text-base font-medium">friends</h1>
      <section>
        <h2 className="section-border pb-2 text-sm font-medium">requests</h2>
        {requests.length === 0 ? <p className="py-4 text-sm text-[#cccccc]">no requests.</p> : null}
        {requests.map((row) => (
          <div key={row.id} className="section-border flex items-center justify-between py-3">
            <span>{row.requester?.username ?? row.requester_id}</span>
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  await supabase.from("friends").update({ status: "accepted" }).eq("id", row.id);
                  await load(userId);
                }}
              >
                accept
              </Button>
              <Button
                onClick={async () => {
                  await supabase.from("friends").update({ status: "rejected" }).eq("id", row.id);
                  await load(userId);
                }}
              >
                reject
              </Button>
            </div>
          </div>
        ))}
      </section>
      <section>
        <h2 className="section-border pb-2 text-sm font-medium">friends</h2>
        {friends.length === 0 ? <p className="py-4 text-sm text-[#cccccc]">no friends.</p> : null}
        {friends.map((row) => {
          const username =
            row.requester_id === userId ? row.addressee?.username ?? row.addressee_id : row.requester?.username ?? row.requester_id;
          return (
            <div key={row.id} className="section-border flex items-center justify-between py-3">
              <span>{username}</span>
              <Link className="text-sm underline" href="/compose">
                message
              </Link>
            </div>
          );
        })}
      </section>
    </div>
  );
}
