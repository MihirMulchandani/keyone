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
    <div className="page">
      <h1 className="page-title">friends</h1>

      <div className="section">
        <div className="section-title">requests</div>
        {requests.length === 0 ? <p className="muted text-[15px]">no requests.</p> : null}
        {requests.map((row) => (
          <div key={row.id} className="row">
            <span className="text-[15px]">{row.requester?.username ?? row.requester_id}</span>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
      </div>

      <div className="section">
        <div className="section-title">friends</div>
        {friends.length === 0 ? <p className="muted text-[15px]">no friends.</p> : null}
        {friends.map((row) => {
          const username =
            row.requester_id === userId ? row.addressee?.username ?? row.addressee_id : row.requester?.username ?? row.requester_id;
          return (
            <div key={row.id} className="row">
              <span className="text-[15px]">{username}</span>
              <Link className="text-[15px] underline" href="/compose">
                message
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
