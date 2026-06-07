"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import AppShell from "@/components/layout/AppShell";
import CustomerTable from "@/components/customers/CustomerTable";
import { motion } from "framer-motion";
import { 
  Users, 
  CheckCircle2, 
  Activity,
  Mail,
  ArrowUpRight,
  Calendar,
  MoreVertical,
  TrendingUp,
  Heart
} from "lucide-react";

export default function DashboardPage() {
  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    gender: "",
    stage: "",
    city: "",
    page: 1,
  });

  // Query customers using TanStack Query
  const { data, isLoading, error } = useQuery({
    queryKey: ["customers", filters],
    queryFn: async () => {
      const res = await api.get("/customers", {
        params: {
          ...filters,
          perPage: 10, // Paginate by 10
        },
      });
      return res.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute cache validity for instant load on detail page navigation
  });

  // Query database statistics/metrics from optimized backend aggregate endpoint
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/customers/stats");
      return res.data.data;
    },
  });

  const totalCount = statsData?.total ?? 0;
  const activeCount = statsData?.active ?? 0;
  const matchSentCount = statsData?.matchSent ?? 0;
  const matchedCount = statsData?.matched ?? 0;
  const onboardingCount = statsData?.onboarding ?? 0;

  // Derive pipeline metrics
  const activeAndSent = activeCount + matchSentCount + onboardingCount;
  const progressPct = totalCount ? Math.round((activeAndSent / totalCount) * 100) : 62;
  const successRatePct = totalCount ? Math.round((matchedCount / totalCount) * 100) : 25;

  const stats = [
    {
      name: "Assigned Clients",
      value: totalCount,
      subLabel: "Total clients",
      icon: Users,
      color: "text-[#B99AF5]",
      bg: "bg-[#B99AF5]/10",
      border: "border-[#B99AF5]/20",
    },
    {
      name: "Active Matching Pool",
      value: activeCount,
      subLabel: "In progress",
      icon: Activity,
      color: "text-[#6CBF8D]",
      bg: "bg-[#6CBF8D]/10",
      border: "border-[#6CBF8D]/20",
    },
    {
      name: "Outreaches Sent",
      value: matchSentCount,
      subLabel: "This month",
      icon: Mail,
      color: "text-[#7DA8FF]",
      bg: "bg-[#7DA8FF]/10",
      border: "border-[#7DA8FF]/20",
    },
    {
      name: "Successfully Matched",
      value: matchedCount,
      subLabel: "Completed",
      icon: CheckCircle2,
      color: "text-[#E8C75F]",
      bg: "bg-[#E8C75F]/10",
      border: "border-[#E8C75F]/20",
    },
  ];

  // Container motion presets for smooth staggered fade-in
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  } as any;

  return (
    <AppShell>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-10"
      >
        {/* Header Title Section */}
        <motion.div variants={itemVariants} className="flex flex-col gap-1">
          <h1 className="font-absans text-4xl md:text-5xl font-normal tracking-tight text-text-primary leading-tight">
            Customer Roster
          </h1>
          <p className="text-sm text-text-secondary font-sans font-medium">
            Curate and matches candidates in your assigned pipeline
          </p>
        </motion.div>

        {/* 1. Metrics Grid Summary */}
        {isLoadingStats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col justify-between p-6 rounded-[24px] bg-white border border-border-subtle shadow-[0_4px_20px_rgba(0,0,0,0.01)] animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent-surface/30 shrink-0" />
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <div className="h-3.5 bg-accent-surface/30 rounded-md w-2/3" />
                    <div className="h-7 bg-accent-surface/40 rounded-md w-1/3 mt-1" />
                    <div className="h-3 bg-accent-surface/20 rounded-md w-1/2 mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div 
            variants={itemVariants} 
            className="grid grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.name}
                  className="flex flex-col justify-between p-6 rounded-[24px] bg-white border border-border-subtle hover:shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-shadow duration-300 relative group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${stat.bg} border ${stat.border} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-text-secondary font-semibold tracking-wide truncate pr-4">
                        {stat.name}
                      </span>
                      <span className="text-3xl font-bold text-text-primary mt-1 font-sans leading-none">
                        {stat.value}
                      </span>
                      <span className="text-[11px] text-text-muted mt-1 font-medium">
                        {stat.subLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* 2. Content Workstation Split (Widgets + Roster Workspace) */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Column: Utility Widgets */}
          <motion.div 
            variants={itemVariants}
            className="w-full lg:w-[300px] shrink-0 flex flex-col gap-6"
          >
            {/* Widget 1: Matching Pipeline Progress */}
            {isLoadingStats ? (
              <div className="p-6 rounded-[28px] bg-[#FBFAF7] border border-border-subtle flex flex-col gap-6 relative shadow-[0_2px_12px_rgba(0,0,0,0.01)] animate-pulse">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-text-primary tracking-wide uppercase">
                    Matching Pipeline
                  </span>
                  <div className="w-4 h-4 rounded-full bg-accent-surface/30" />
                </div>

                <div className="flex justify-center items-center py-2">
                  <div className="w-32 h-32 rounded-full border-[8px] border-accent-surface/30 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-6 bg-accent-surface/30 rounded-md" />
                      <div className="w-12 h-3 bg-accent-surface/20 rounded-md mt-1.5" />
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between bg-white rounded-2xl p-4 border border-border-subtle/50 h-16">
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-4 bg-accent-surface/30 rounded-md w-1/2" />
                    <div className="h-3 bg-accent-surface/20 rounded-md w-2/3" />
                  </div>
                  <div className="flex items-end gap-1 h-8 shrink-0">
                    {[20, 30, 40, 25, 35, 30, 45].map((_, i) => (
                      <div key={i} className="w-1 h-6 rounded-full bg-accent-surface/30" />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-[28px] bg-[#FBFAF7] border border-border-subtle flex flex-col gap-6 relative shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-text-primary tracking-wide uppercase">
                    Matching Pipeline
                  </span>
                  <button className="text-text-muted hover:text-text-primary p-1 rounded-full hover:bg-white transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Circle Visual */}
                <div className="flex justify-center items-center py-2 relative">
                  {/* SVG Progress Circle */}
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="52"
                      stroke="#E3DDEC"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="52"
                      stroke="#B99AF5"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 52}
                      initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - progressPct / 100) }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-text-primary">{progressPct}%</span>
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-0.5">Progress</span>
                  </div>
                </div>

                {/* Description */}
                <div className="flex items-end justify-between bg-white rounded-2xl p-4 border border-border-subtle/50">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-text-primary leading-tight">
                      {totalCount ? `${activeAndSent} of ${totalCount}` : "25 of 40"}
                    </span>
                    <span className="text-[10px] text-text-muted font-semibold mt-0.5">
                      profiles in progress
                    </span>
                  </div>
                  {/* Sparkline Bar Chart Indicator */}
                  <div className="flex items-end gap-1 h-8 shrink-0">
                    {[30, 45, 60, 35, 75, 55, 90].map((h, i) => (
                      <div 
                        key={i} 
                        className="w-1 rounded-full bg-soft-purple" 
                        style={{ height: `${h}%`, opacity: 0.3 + (i * 0.1) }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Widget 2: Weekly Activity Summary */}
            {isLoadingStats ? (
              <div className="p-6 rounded-[28px] bg-[#FBFAF7] border border-border-subtle flex flex-col gap-5 relative shadow-[0_2px_12px_rgba(0,0,0,0.01)] animate-pulse">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-text-primary tracking-wide uppercase">
                    This Week's Activity
                  </span>
                  <div className="w-4 h-4 rounded-full bg-accent-surface/30" />
                </div>
                <div className="flex flex-col gap-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-border-subtle/50">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-accent-surface/30 animate-pulse" />
                        <div className="w-24 h-3 bg-accent-surface/20 rounded-md animate-pulse" />
                      </div>
                      <div className="w-6 h-4 bg-accent-surface/30 rounded-md animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-[28px] bg-[#FBFAF7] border border-border-subtle flex flex-col gap-5 relative shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-text-primary tracking-wide uppercase">
                    This Week's Activity
                  </span>
                  <button className="text-text-muted hover:text-text-primary p-1 rounded-full hover:bg-white transition-colors">
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Onboardings */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-border-subtle/50">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-warm-yellow/10 border border-warm-yellow/20 flex items-center justify-center">
                        <span className="text-warm-yellow text-xs font-bold">★</span>
                      </div>
                      <span className="text-xs text-text-secondary font-medium">New Onboardings</span>
                    </div>
                    <span className="text-sm font-bold text-text-primary">{onboardingCount}</span>
                  </div>

                  {/* Matches Sent */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-border-subtle/50">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-soft-blue/10 border border-soft-blue/20 flex items-center justify-center">
                        <Mail className="w-3.5 h-3.5 text-soft-blue" />
                      </div>
                      <span className="text-xs text-text-secondary font-medium">Matches Sent</span>
                    </div>
                    <span className="text-sm font-bold text-text-primary">{matchSentCount}</span>
                  </div>

                  {/* Matched */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-border-subtle/50">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-soft-green/10 border border-soft-green/20 flex items-center justify-center">
                        <Heart className="w-3.5 h-3.5 text-soft-green fill-soft-green/20" />
                      </div>
                      <span className="text-xs text-text-secondary font-medium">Successfully Matched</span>
                    </div>
                    <span className="text-sm font-bold text-text-primary">{matchedCount}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Widget 3: Success Rate Widget */}
            {isLoadingStats ? (
              <div className="p-6 rounded-[28px] bg-[#FBFAF7] border border-border-subtle flex flex-col gap-4 relative shadow-[0_2px_12px_rgba(0,0,0,0.01)] animate-pulse">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-text-primary tracking-wide uppercase">
                    Success Rate
                  </span>
                  <div className="w-4 h-4 rounded-full bg-accent-surface/30" />
                </div>
                <div className="flex items-center justify-between gap-4 mt-2">
                  <div className="flex flex-col gap-2">
                    <div className="h-8 bg-accent-surface/30 rounded-md w-16" />
                    <div className="h-3.5 bg-accent-surface/20 rounded-md w-20" />
                  </div>
                  <div className="w-32 h-12 bg-accent-surface/10 rounded-lg" />
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-[28px] bg-[#FBFAF7] border border-border-subtle flex flex-col gap-4 relative shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-text-primary tracking-wide uppercase">
                    Success Rate
                  </span>
                  <button className="text-text-muted hover:text-text-primary p-1 rounded-full hover:bg-white transition-colors">
                    <TrendingUp className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 mt-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-3xl font-bold text-text-primary">{successRatePct}%</span>
                      <span className="text-[10px] text-soft-green font-bold bg-soft-green/15 px-1.5 py-0.5 rounded-md flex items-center">
                        ↑
                      </span>
                    </div>
                    <span className="text-[11px] text-text-muted font-medium mt-1">Last 30 days</span>
                  </div>

                  {/* Premium SVG Line Sparkline */}
                  <div className="w-32 h-12 shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 120 40">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#B99AF5" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#B99AF5" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 5 35 Q 25 38 40 22 T 80 15 T 115 8"
                        fill="none"
                        stroke="#B99AF5"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 5 35 Q 25 38 40 22 T 80 15 T 115 8 L 115 40 L 5 40 Z"
                        fill="url(#chartGradient)"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Right Column: Roster Table Workspace */}
          <motion.div 
            variants={itemVariants}
            className="flex-1 w-full min-w-0"
          >
            {error ? (
              <div className="p-6 rounded-[24px] bg-red-500/10 border border-red-500/20 text-center text-sm font-sans text-red-200">
                Failed to query client database. Confirm Express API is live and try again.
              </div>
            ) : (
              <CustomerTable
                customers={data?.data || []}
                meta={data?.meta || { total: 0, page: 1, perPage: 10 }}
                filters={filters}
                setFilters={setFilters}
                isLoading={isLoading}
              />
            )}
          </motion.div>
        </div>

        {/* 3. Bottom Summary Row */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-2 lg:grid-cols-4 border-t border-border-subtle/80 pt-8 mt-4"
        >
          {/* Seg 1: Total Clients */}
          <div className="flex items-center gap-4 px-4 py-2">
            <div className="w-10 h-10 rounded-full bg-soft-purple/10 border border-soft-purple/20 flex items-center justify-center shrink-0">
              <Users className="w-4.5 h-4.5 text-soft-purple" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider leading-none">Total Clients</span>
              <span className="text-xl font-bold text-text-primary mt-1 leading-none">{totalCount}</span>
              <span className="text-[10px] text-text-muted font-semibold mt-1 leading-none">All time</span>
            </div>
          </div>

          {/* Seg 2: Matches Sent */}
          <div className="flex items-center gap-4 px-4 py-2 border-l border-dashed border-border-subtle">
            <div className="w-10 h-10 rounded-full bg-soft-blue/10 border border-soft-blue/20 flex items-center justify-center shrink-0">
              <Mail className="w-4.5 h-4.5 text-soft-blue" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider leading-none">Matches Sent</span>
              <span className="text-xl font-bold text-text-primary mt-1 leading-none">{matchSentCount}</span>
              <span className="text-[10px] text-text-muted font-semibold mt-1 leading-none">This month</span>
            </div>
          </div>

          {/* Seg 3: Successfully Matched */}
          <div className="flex items-center gap-4 px-4 py-2 border-l border-dashed border-border-subtle">
            <div className="w-10 h-10 rounded-full bg-soft-green/10 border border-soft-green/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4.5 h-4.5 text-soft-green" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider leading-none">Successfully Matched</span>
              <span className="text-xl font-bold text-text-primary mt-1 leading-none">{matchedCount}</span>
              <span className="text-[10px] text-text-muted font-semibold mt-1 leading-none">All time</span>
            </div>
          </div>

          {/* Seg 4: Success Rate */}
          <div className="flex items-center gap-4 px-4 py-2 border-l border-dashed border-border-subtle">
            <div className="w-10 h-10 rounded-full bg-soft-purple/10 border border-soft-purple/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4.5 h-4.5 text-soft-purple" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider leading-none">Success Rate</span>
              <span className="text-xl font-bold text-text-primary mt-1 leading-none">{successRatePct}%</span>
              <span className="text-[10px] text-text-muted font-semibold mt-1 leading-none">Last 30 days</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
