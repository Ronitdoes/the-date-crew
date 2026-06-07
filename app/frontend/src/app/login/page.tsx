"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

// Register the hook
gsap.registerPlugin(useGSAP);

export default function LoginPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useGSAP(() => {
    // Form elements stagger entry reveal
    const tl = gsap.timeline();
    tl.fromTo(
      cardRef.current,
      { opacity: 0, y: 40, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
    );
    tl.fromTo(
      ".stagger-item",
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" },
      "-=0.4"
    );
  }, { scope: containerRef });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Submit login payload to Express API
      const response = await api.post("/auth/login", { email, password });
      const { accessToken, refreshToken, matchmaker } = response.data.data;

      // 2. Synchronize Supabase Client Session to set browser cookies for server middleware
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        throw new Error(sessionError.message || "Failed to set Supabase session");
      }

      // 3. Save matching profiles metadata to Zustand store
      useAuthStore.getState().setAuth(accessToken, matchmaker);

      // 4. Smoothly route to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          "Invalid email or password. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full min-h-screen flex items-center justify-center bg-[#9da1fc] px-4 select-none relative overflow-hidden"
      style={{
        backgroundImage: "url('/hero.avif')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Light glass overlay */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm pointer-events-none" />

      {/* Login Card */}
      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-[28px] p-8 md:p-10 shadow-2xl shadow-black/15 text-white"
      >
        <div className="text-center mb-8">
          <h2 className="font-absans text-3xl md:text-4xl font-normal tracking-tight mb-2 stagger-item">
            Welcome Back
          </h2>
          <p className="text-white/80 text-sm tracking-wide font-sans stagger-item">
            Access your matchmaking dashboard
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm font-sans text-center stagger-item">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email field */}
          <div className="flex flex-col gap-2 stagger-item">
            <label className="text-sm text-white/90 font-medium tracking-wide font-sans pl-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder=" Priya@tdc.com"
              className="w-full h-12 px-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-md outline-none text-white placeholder-white/40 font-sans focus:border-white/60 transition-colors duration-200"
            />
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-2 stagger-item">
            <label className="text-sm text-white/90 font-medium tracking-wide font-sans pl-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full h-12 px-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-md outline-none text-white placeholder-white/40 font-sans focus:border-white/60 transition-colors duration-200"
            />
          </div>

          {/* Submit CTA button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-4 rounded-full border border-white/30 bg-white text-black font-semibold tracking-wide font-sans transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center stagger-item"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

      </div>
    </div>
  );
}
