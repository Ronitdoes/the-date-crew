"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  LogOut,
  ChevronDown
} from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { matchmaker, clearAuth, setLoggingOut } = useAuthStore();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post("/auth/logout").catch(() => { });
      await supabase.auth.signOut().catch(() => { });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  const navLinks: { name: string; href: string; icon: any }[] = [];

  // Premium photo for Priya Sharma (Matchmaker)
  const matchmakerAvatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150";

  return (
    <div className="w-full min-h-screen flex flex-col bg-primary-bg text-text-primary font-sans relative overflow-x-hidden">
      {/* 1. Header (Top Nav) */}
      <div className="absolute top-0 left-0 right-0 px-4 md:px-8 pt-4 md:pt-6 z-40 pointer-events-none">
        <header className="h-20 border border-border-subtle/80 flex items-center justify-between px-6 md:px-8 rounded-2xl bg-white/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.02)] pointer-events-auto">
        {/* Left section (Logo + Desktop Nav Links) */}
        <div className="flex items-center gap-4 md:gap-8">

          {/* Brand Identity Section */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-soft-purple/10 border border-soft-purple/20 flex items-center justify-center">
              <span className="text-soft-purple text-sm">♥</span>
            </div>
            <span className="font-sans text-[15px] tracking-[0.15em] font-semibold uppercase text-text-primary">
              The Date Crew
            </span>
          </div>

          {/* Desktop Navigation Links (beside brand section) */}
          <nav className="hidden md:flex items-center gap-1.5 ml-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 h-9 px-4 rounded-full transition-all duration-300 ${isActive
                      ? "bg-accent-surface text-text-primary font-semibold shadow-sm"
                      : "text-text-secondary hover:text-text-primary hover:bg-accent-surface/30"
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-charcoal" : "text-text-muted"}`} />
                  <span className="text-xs font-semibold tracking-wide">{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section (User Session Profile Card relocated) */}
        <div className="relative shrink-0">
          <div
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-3 p-2 px-3 rounded-2xl bg-white border border-border-subtle/80 hover:bg-[#FAF8FD] transition-all duration-300 cursor-pointer select-none shadow-[0_1px_8px_rgba(0,0,0,0.01)]"
          >
            <div className="relative shrink-0">
              <img
                src={matchmakerAvatar}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-soft-green border-2 border-white rounded-full" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <p className="text-xs font-semibold text-text-primary leading-tight">
                {matchmaker?.fullName || "Priya Sharma"}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5 font-bold leading-tight">
                {matchmaker?.email || "demo@tdc.com"}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
          </div>

          {/* Sign Out Actions Dropdown */}
          <AnimatePresence>
            {userDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 mt-2 w-52 bg-white border border-border-subtle rounded-2xl p-2 shadow-lg z-50"
              >
                <div className="px-3 py-2 border-b border-border-subtle/50 mb-1">
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Role</p>
                  <p className="text-xs font-semibold text-text-primary mt-0.5">Matchmaker Specialist</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </header>
      </div>

      {/* 2. Main Workstation scrollable body (stretching 100% width) */}
      <main className="flex-1 w-full overflow-y-auto pt-28 md:pt-32">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-8 pb-8 md:pb-10">
          {children}
        </div>
      </main>


    </div>
  );
}
