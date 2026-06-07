"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Preloader from "@/components/preloader";

// Custom hydrator component to restore session and load database profile
function SessionHydrator({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [preloaderComplete, setPreloaderComplete] = useState(false);
  const [logoutReady, setLogoutReady] = useState(false);
  const { setAuth, clearAuth, isLoggingOut, setLoggingOut } = useAuthStore();
  const pathname = usePathname();
  const logoutStartTimeRef = useRef<number | null>(null);

  // When logging out, show preloader with intro animation, then after we have routed
  // to the login page, trigger the exit animation to reveal the login page underneath.
  useEffect(() => {
    if (isLoggingOut) {
      if (!logoutStartTimeRef.current) {
        logoutStartTimeRef.current = Date.now();
        setPreloaderComplete(false);
        setLogoutReady(false);
      }

      if (pathname === "/login") {
        // Ensure the preloader intro plays for at least 1.2s to look premium and natural
        const elapsed = Date.now() - (logoutStartTimeRef.current || Date.now());
        const delay = Math.max(200, 1200 - elapsed); // at least 200ms delay to make sure rendering is complete

        const timer = setTimeout(() => {
          setLogoutReady(true);
          logoutStartTimeRef.current = null; // reset
        }, delay);
        return () => clearTimeout(timer);
      }
    } else {
      logoutStartTimeRef.current = null;
    }
  }, [isLoggingOut, pathname]);

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

  // Determine preloader hydrated prop:
  // - Normal load: pass through `hydrated` so preloader exits once session is resolved
  // - Logout: pass `logoutReady` so preloader exits after the intro delay
  const preloaderHydrated = isLoggingOut ? logoutReady : hydrated;

  const handlePreloaderComplete = useCallback(() => {
    if (isLoggingOut) {
      // Logout transition complete — clear the flag so the app returns to normal
      setLoggingOut(false);
      setLogoutReady(false);
    }
    setPreloaderComplete(true);
  }, [isLoggingOut, setLoggingOut]);

  return (
    <>
      {(!preloaderComplete || isLoggingOut) && (
        <Preloader
          hydrated={preloaderHydrated}
          onComplete={handlePreloaderComplete}
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
