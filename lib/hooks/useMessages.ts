"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { MessageRow } from "@/lib/supabase/types";

export function useMessages(userId: string | null) {
  return useQuery({
    queryKey: ["messages", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("receiver_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw new Error("unable to load messages.");
      return data as MessageRow[];
    },
  });
}
