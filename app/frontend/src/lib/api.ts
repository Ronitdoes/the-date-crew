import axios from "axios";
import { useAuthStore } from "../store/authStore";

import { supabase } from "./supabase";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Inject Bearer access token into outgoing requests
api.interceptors.request.use(
  async (config) => {
    let token = useAuthStore.getState().accessToken;
    
    // Fallback: Hydrate token from Supabase session if Zustand is empty
    if (!token) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          token = session.access_token;
          
          // Sync to Zustand store if empty
          const matchmaker = useAuthStore.getState().matchmaker;
          useAuthStore.getState().setAuth(
            token,
            matchmaker || {
              id: session.user.id,
              fullName: session.user.user_metadata?.full_name || "",
              email: session.user.email || "",
            }
          );
        }
      } catch (err) {
        console.error("Failed to sync Supabase session in interceptor:", err);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auto-redirect to login on 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
