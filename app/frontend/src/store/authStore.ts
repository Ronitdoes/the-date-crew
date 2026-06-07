import { create } from "zustand";

interface Matchmaker {
  id: string;
  fullName: string;
  email: string;
}

interface AuthState {
  accessToken: string | null;
  matchmaker: Matchmaker | null;
  isLoggingOut: boolean;
  setAuth: (token: string, matchmaker: Matchmaker) => void;
  clearAuth: () => void;
  setLoggingOut: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  matchmaker: null,
  isLoggingOut: false,
  setAuth: (token, matchmaker) => set({ accessToken: token, matchmaker }),
  clearAuth: () => set({ accessToken: null, matchmaker: null }),
  setLoggingOut: (val) => set({ isLoggingOut: val }),
}));
