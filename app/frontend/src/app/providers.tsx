"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Preloader from "@/components/preloader";

// Custom hydrator component to restore session and load database profile
function SessionHydrator({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [preloaderComplete, setPreloaderComplete] = useState(false);
  const { setAuth, clearAuth, isLoggingOut } = useAuthStore();

  useEffect(() => {
    if (isLoggingOut) {
      setPreloaderComplete(false);
    }
  }, [isLoggingOut]);

  useEffect(() => {
    let active = true;

    // Listen to Supabase auth state changes and consolidate all session loading logic here
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session && active) {
          const token = session.access_token;
          const currentStore = useAuthStore.getState();
          const currentToken = currentStore.accessToken;
          const currentMatchmaker = currentStore.matchmaker;

          // Only fetch/set if the access token has changed or matchmaker profile is missing
          if (token !== currentToken || !currentMatchmaker) {
            try {
              const res = await api.get("/auth/me", {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });
              
              if (active) {
                setAuth(token, res.data.data.matchmaker);
              }
            } catch (apiErr) {
              console.error("Failed to fetch matchmaker profile from API, falling back to session metadata:", apiErr);
              // Fallback to session user metadata if backend API is not responding or fails temporarily
              if (active) {
                setAuth(token, {
                  id: session.user.id,
                  fullName: session.user.user_metadata?.full_name || "Matchmaker",
                  email: session.user.email || "",
                });
              }
            }
          }
        } else if (active) {
          clearAuth();
        }
      } catch (err) {
        console.error("Error in onAuthStateChange handler:", err);
      } finally {
        if (active) {
          setHydrated(true);
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [setAuth, clearAuth]);

  return (
    <>
      {(!preloaderComplete || isLoggingOut) && (
        <Preloader
          hydrated={!isLoggingOut && hydrated}
          onComplete={() => {
            if (!isLoggingOut) {
              setPreloaderComplete(true);
            }
          }}
        />
      )}
      {hydrated && children}
    </>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  // Leverage state so each session gets its own isolated cache instance
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes default cache validity instead of 2 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes cache retention
            refetchOnWindowFocus: false, // Turn off focus refetch to prevent layout shifts during demo
            refetchOnReconnect: false, // Disable background reconnect refetches
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionHydrator>{children}</SessionHydrator>
    </QueryClientProvider>
  );
}
