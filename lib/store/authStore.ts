import { create } from "zustand";

type AuthState = {
  userId: string | null;
  username: string | null;
  setAuth: (userId: string | null, username: string | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  username: null,
  setAuth: (userId, username) => set({ userId, username }),
}));
