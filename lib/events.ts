"use client";

import { supabase } from "@/lib/supabase/client";

export async function trackEvent(
  userId: string,
  event: string,
  metadata: Record<string, string | number | boolean | null>,
) {
  await supabase.from("events").insert({
    user_id: userId,
    event,
    metadata,
  });
}
