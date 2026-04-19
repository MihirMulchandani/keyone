import { create } from "zustand";
import type { MessageRow } from "@/lib/supabase/types";

type MessageState = {
  messages: MessageRow[];
  setMessages: (messages: MessageRow[]) => void;
  addMessageToInbox: (message: MessageRow) => void;
};

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessageToInbox: (message) =>
    set((state) => ({ messages: [message, ...state.messages] })),
}));
