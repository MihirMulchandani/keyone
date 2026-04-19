"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

export type FriendRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

export function useFriends(userId: string | null) {
  return useQuery({
    queryKey: ["friends", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("friends").select("*");
      if (error) throw new Error("unable to load friends.");
      return data as FriendRow[];
    },
  });
}
