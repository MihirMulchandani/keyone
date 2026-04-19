"use client";

import { supabase } from "@/lib/supabase/client";

export async function checkRateLimit(
  userId: string,
  action: "messages" | "friend_requests" | "search",
): Promise<boolean> {
  const now = new Date();
  const windows: Record<typeof action, { max: number; minutes: number }> = {
    messages: { max: 15, minutes: 1 },
    friend_requests: { max: 15, minutes: 3 },
    search: { max: 20, minutes: 5 },
  };
  const conf = windows[action];
  const start = new Date(now.getTime() - conf.minutes * 60_000).toISOString();

  const { data } = await supabase
    .from("rate_limits")
    .select("id,count")
    .eq("user_id", userId)
    .eq("action", action)
    .gte("window_start", start);

  const used = (data ?? []).reduce((acc, row) => acc + Number(row.count ?? 1), 0);
  if (used >= conf.max) return false;

  await supabase.from("rate_limits").insert({
    user_id: userId,
    action,
    window_start: now.toISOString(),
    count: 1,
  });
  return true;
}
