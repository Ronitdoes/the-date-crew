"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Search, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Eye, 
  ChevronDown
} from "lucide-react";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  city: string;
  maritalStatus: string;
  journeyStage: string;
  profilePhotoUrl?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
}

interface Meta {
  total: number;
  page: number;
  perPage: number;
}

interface CustomerTableProps {
  customers: Customer[];
  meta: Meta;
  filters: {
    search: string;
    gender: string;
    stage: string;
    city: string;
    page: number;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    search: string;
    gender: string;
    stage: string;
    city: string;
    page: number;
  }>>;
  isLoading: boolean;
}

export default function CustomerTable({
  customers,
  meta,
  filters,
  setFilters,
  isLoading
}: CustomerTableProps) {
  const router = useRouter();
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Sync local search after debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: localSearch, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, setFilters]);

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, gender: e.target.value, page: 1 }));
  };

  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, stage: e.target.value, page: 1 }));
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, city: e.target.value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.perPage));

  const getStageBadgeStyles = (stage: string) => {
    switch (stage) {
      case "active":
        return "bg-soft-green/15 text-soft-green";
      case "match_sent":
        return "bg-soft-blue/15 text-soft-blue";
      case "matched":
        return "bg-soft-purple/15 text-soft-purple";
      case "onboarding":
        return "bg-warm-yellow/15 text-[#B38F24]";
      case "paused":
      case "closed":
      default:
        return "bg-charcoal/10 text-charcoal/70";
    }
  };

  const formatStage = (stage: string) => {
    return stage.replace("_", " ").toUpperCase();
  };

  // High quality avatars for visual excellence
  const getAvatarPhoto = (customer: Customer) => {
    if (customer.profilePhotoUrl) return customer.profilePhotoUrl;
    
    // Matched index falls back to dynamic avatar illustrations
    const femaleAvatars = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
    ];
    const maleAvatars = [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
    ];

    const idx = customer.firstName.charCodeAt(0) % 2;
    return customer.gender === "female" ? femaleAvatars[idx] : maleAvatars[idx];
  };

  // Framer Motion staggered list variants
  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      }
    }
  } as any;

  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  } as any;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Filter Options Control Bar */}
      <div className="w-full flex flex-col sm:flex-row flex-wrap items-center gap-4">
        {/* Search filter */}
        <div className="relative flex-1 min-w-[240px] w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search customer name..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full h-11 pl-11 pr-4 rounded-full border border-border-subtle bg-[#FBFAF7] text-text-primary text-xs font-semibold outline-none focus:border-warm-yellow focus:bg-white transition-all shadow-[0_2px_12px_rgba(0,0,0,0.01)]"
          />
        </div>

        {/* Dropdowns group */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Gender filter */}
          <div className="relative shrink-0 w-full sm:w-[160px]">
            <select
              value={filters.gender}
              onChange={handleGenderChange}
              className="w-full h-11 pl-5 pr-10 rounded-full border border-border-subtle bg-[#FBFAF7] text-text-primary text-xs font-semibold outline-none appearance-none cursor-pointer focus:border-warm-yellow hover:bg-accent-surface/20 transition-all"
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>

          {/* Stage/Status filter */}
          <div className="relative shrink-0 w-full sm:w-[160px]">
            <select
              value={filters.stage}
              onChange={handleStageChange}
              className="w-full h-11 pl-5 pr-10 rounded-full border border-border-subtle bg-[#FBFAF7] text-text-primary text-xs font-semibold outline-none appearance-none cursor-pointer focus:border-warm-yellow hover:bg-accent-surface/20 transition-all"
            >
              <option value="">All Stages</option>
              <option value="onboarding">Onboarding</option>
              <option value="active">Active Pool</option>
              <option value="match_sent">Match Sent</option>
              <option value="matched">Matched</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>

          {/* City filter */}
          <div className="relative shrink-0 w-full sm:w-[160px]">
            <select
              value={filters.city}
              onChange={handleCityChange}
              className="w-full h-11 pl-5 pr-10 rounded-full border border-border-subtle bg-[#FBFAF7] text-text-primary text-xs font-semibold outline-none appearance-none cursor-pointer focus:border-warm-yellow hover:bg-accent-surface/20 transition-all"
            >
              <option value="">All Cities</option>
              <option value="Delhi">Delhi</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Pune">Pune</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Chennai">Chennai</option>
              <option value="Kolkata">Kolkata</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 2. Roster Grid Table Container */}
      <div className="w-full overflow-hidden">
        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-border-subtle scrollbar-track-transparent">
          <table className="w-full text-left border-collapse border-separate border-spacing-y-3">
            <thead>
              <tr className="text-text-muted text-[10px] font-bold tracking-widest uppercase">
                <th className="py-2 px-6 font-sans">Full Name</th>
                <th className="py-2 px-4 font-sans">Age / Gender</th>
                <th className="py-2 px-4 font-sans">Location</th>
                <th className="py-2 px-4 font-sans">Marital Status</th>
                <th className="py-2 px-4 font-sans">Journey Stage</th>
                <th className="py-2 px-6 text-center font-sans">Workspace</th>
              </tr>
            </thead>
            <motion.tbody 
              variants={listVariants}
              initial="hidden"
              animate="show"
              key={customers.length + "-" + isLoading}
            >
              {isLoading ? (
                // Table loading shimmer rows
                Array(4)
                  .fill(0)
                  .map((_, idx) => (
                    <tr key={idx} className="animate-pulse bg-white border border-border-subtle/40 rounded-2xl">
                      <td className="py-5 px-6 border-y border-l border-border-subtle rounded-l-2xl">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-primary-bg shrink-0" />
                          <div className="flex flex-col gap-1.5 w-28">
                            <div className="h-4 bg-primary-bg rounded-full" />
                            <div className="h-3 bg-primary-bg rounded-full w-20" />
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-4 border-y border-border-subtle"><div className="h-4 bg-primary-bg rounded-full w-16" /></td>
                      <td className="py-5 px-4 border-y border-border-subtle"><div className="h-4 bg-primary-bg rounded-full w-20" /></td>
                      <td className="py-5 px-4 border-y border-border-subtle"><div className="h-4 bg-primary-bg rounded-full w-16" /></td>
                      <td className="py-5 px-4 border-y border-border-subtle"><div className="h-6 bg-primary-bg rounded-full w-24" /></td>
                      <td className="py-5 px-6 border-y border-r border-border-subtle rounded-r-2xl text-center">
                        <div className="h-9 bg-primary-bg rounded-full w-24 mx-auto" />
                      </td>
                    </tr>
                  ))
              ) : customers.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={6} className="py-16 text-center bg-white border border-border-subtle rounded-2xl">
                    <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-[#FBFAF7] flex items-center justify-center border border-border-subtle text-text-muted">
                        <Clock className="w-5 h-5" />
                      </div>
                      <p className="text-text-primary font-bold font-sans">No matching customers found</p>
                      <p className="text-text-muted text-xs font-sans text-center leading-normal font-medium">
                        No clients fit the chosen criteria. Reset filters or update search tags to query new leads.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Loaded rows
                customers.map((customer) => (
                  <motion.tr
                    key={customer.id}
                    variants={rowVariants}
                    className="group"
                  >
                    {/* Name column */}
                    <td className="py-4 px-6 bg-white border-y border-l border-border-subtle group-hover:bg-[#FBFAF7]/60 rounded-l-2xl transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full border border-border-subtle shrink-0 overflow-hidden shadow-sm">
                          <img 
                            src={getAvatarPhoto(customer)} 
                            alt={customer.firstName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-text-primary font-sans tracking-wide">
                            {customer.firstName} {customer.lastName}
                          </span>
                          <span className="text-[11px] text-text-muted font-sans font-semibold mt-0.5">
                            {customer.email || "No email stored"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Age / Gender */}
                    <td className="py-4 px-4 bg-white border-y border-border-subtle group-hover:bg-[#FBFAF7]/60 font-sans text-xs font-semibold text-text-secondary capitalize transition-all duration-300">
                      {customer.age} Yrs <span className="text-border-subtle px-1">•</span> {customer.gender}
                    </td>

                    {/* City Location */}
                    <td className="py-4 px-4 bg-white border-y border-border-subtle group-hover:bg-[#FBFAF7]/60 text-xs text-text-secondary transition-all duration-300">
                      <div className="flex items-center gap-1.5 font-sans font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-[#B99AF5] stroke-[2.5px]" />
                        <span>{customer.city}</span>
                      </div>
                    </td>

                    {/* Marital Status */}
                    <td className="py-4 px-4 bg-white border-y border-border-subtle group-hover:bg-[#FBFAF7]/60 font-sans text-xs font-semibold text-text-secondary capitalize transition-all duration-300">
                      {customer.maritalStatus ? customer.maritalStatus.replace("_", " ") : "Not specified"}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4 bg-white border-y border-border-subtle group-hover:bg-[#FBFAF7]/60 transition-all duration-300">
                      <span className={`inline-flex items-center px-3 py-1 text-[10px] font-bold rounded-full ${getStageBadgeStyles(customer.journeyStage)}`}>
                        {formatStage(customer.journeyStage)}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-6 bg-white border-y border-r border-border-subtle group-hover:bg-[#FBFAF7]/60 rounded-r-2xl text-center transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                      <div className="flex justify-center">
                        <Link
                          href={`/customer/${customer.id}`}
                          className="inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-full bg-white hover:bg-accent-surface/20 text-text-primary border border-border-subtle text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm hover:border-border-subtle/80"
                        >
                          <Eye className="w-3.5 h-3.5 text-text-muted" />
                          <span>Workspace</span>
                        </Link>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </motion.tbody>
          </table>
        </div>

        {/* 3. Pagination Control Footer */}
        {!isLoading && customers.length > 0 && (
          <div className="flex items-center justify-between px-2 py-4 mt-2">
            <span className="text-xs text-text-muted font-bold">
              Showing <span className="text-text-primary">{customers.length}</span> of{" "}
              <span className="text-text-primary">{meta.total}</span> clients
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={filters.page === 1}
                onClick={() => handlePageChange(filters.page - 1)}
                className="w-9 h-9 rounded-full border border-border-subtle bg-white flex items-center justify-center text-text-primary disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:bg-accent-surface/20 transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="text-xs text-text-primary font-bold font-sans px-2">
                Page {filters.page} of {totalPages}
              </span>

              <button
                disabled={filters.page === totalPages}
                onClick={() => handlePageChange(filters.page + 1)}
                className="w-9 h-9 rounded-full border border-border-subtle bg-white flex items-center justify-center text-text-primary disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:bg-accent-surface/20 transition-all shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
