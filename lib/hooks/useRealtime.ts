"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useMessageStore } from "@/lib/store/messageStore";
import type { MessageRow } from "@/lib/supabase/types";

export function useRealtime(userId: string | null) {
  const addMessageToInbox = useMessageStore((s) => s.addMessageToInbox);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("inbox-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          addMessageToInbox(payload.new as MessageRow);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addMessageToInbox, userId]);
}
