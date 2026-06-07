"use client";

import React, { useState } from "react";
import {
  User,
  Briefcase,
  GraduationCap,
  Heart,
  Sparkles,
  MapPin,
  Info,
  Globe
} from "lucide-react";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  age: number;
  profilePhotoUrl?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  country?: string | null;
  city: string;
  heightCm?: number | null;
  weightKg?: number | null;
  undergradCollege?: string | null;
  degree?: string | null;
  postgradCollege?: string | null;
  postgradDegree?: string | null;
  currentCompany?: string | null;
  designation?: string | null;
  annualIncomeInr?: number | null;
  incomeTier?: string | null;
  maritalStatus?: string | null;
  siblings?: number | null;
  caste?: string | null;
  subCaste?: string | null;
  religion?: string | null;
  motherTongue?: string | null;
  gotra?: string | null;
  manglik?: string | null;
  horoscopeRequired?: boolean | null;
  diet?: string | null;
  drinking?: string | null;
  smoking?: string | null;
  familyType?: string | null;
  familyValues?: string | null;
  languagesKnown?: string[] | null;
  wantKids?: string | null;
  openToRelocate?: string | null;
  openToPets?: string | null;
  willingToSettleAbroad?: boolean | null;
  preferredAgeMin?: number | null;
  preferredAgeMax?: number | null;
  preferredHeightMin?: number | null;
  preferredReligion?: string[] | null;
  preferredCaste?: string[] | null;
  preferredCity?: string[] | null;
  aboutMe?: string | null;
}

interface BiodataPanelProps {
  customer: Customer;
}

export default function BiodataPanel({ customer }: BiodataPanelProps) {
  const [activeTab, setActiveTab] = useState<"about" | "personal" | "lifestyle" | "preferences">("about");

  const formatIncome = (tier: string | null | undefined) => {
    if (!tier) return "Not specified";
    return tier.replace("_", " ").toUpperCase();
  };

  const formatBoolean = (val: boolean | null | undefined) => {
    return val ? "Yes" : "No";
  };

  const tabs = [
    { id: "about", name: "About", icon: Info },
    { id: "personal", name: "Personal", icon: User },
    { id: "lifestyle", name: "Lifestyle", icon: Heart },
    { id: "preferences", name: "Preferences", icon: Sparkles },
  ] as const;

  const getFallbackAvatar = (cust: Customer) => {
    if (cust.profilePhotoUrl) return cust.profilePhotoUrl;
    return cust.gender === "female"
      ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150"
      : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150";
  };

  return (
    <div className="w-full flex flex-col gap-6 rounded-[28px] p-6 md:p-8 bg-white border border-border-subtle shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
      {/* 1. Header Profile overview */}
      <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center border-b border-border-subtle/50 pb-6">
        <div className="w-16 h-16 rounded-full border border-border-subtle text-text-primary flex items-center justify-center font-bold text-xl uppercase shrink-0 overflow-hidden shadow-sm">
          <img
            src={getFallbackAvatar(customer)}
            alt={customer.firstName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-text-primary font-sans leading-none">
              {customer.firstName} {customer.lastName}
            </h2>
            <span className="text-[10px] font-bold tracking-widest bg-accent-surface/50 border border-border-subtle px-2.5 py-1 rounded-full text-text-primary uppercase">
              {customer.gender}
            </span>
          </div>
          <p className="text-sm text-text-secondary font-sans mt-2.5 flex items-center gap-1.5 font-medium">
            <MapPin className="w-4 h-4 text-soft-purple stroke-[2.5px]" />
            <span>{customer.city}, {customer.country || "India"}</span>
            <span className="text-border-subtle">•</span>
            <span>{customer.age} years old</span>
          </p>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex gap-1.5 border-b border-border-subtle/50 pb-2 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-[10px] font-bold tracking-wide shrink-0 transition-all cursor-pointer ${isActive
                  ? "bg-accent-surface border-border-subtle text-text-primary shadow-sm"
                  : "bg-transparent border-transparent text-text-muted hover:text-text-primary"
                }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents Workspace */}
      <div className="flex-1 text-text-secondary font-sans text-sm leading-relaxed min-h-[260px]">
        {activeTab === "about" && (
          <div className="flex flex-col gap-5">
            <div>
              <h4 className="text-[10px] font-bold tracking-widest text-text-muted uppercase mb-2">Introduction Summary</h4>
              <p className="bg-[#FBFAF7] border border-border-subtle/60 rounded-2xl p-4 text-text-primary italic font-medium leading-relaxed">
                {customer.aboutMe || "No detailed introduction bio provided for this client profile. Use other metrics fields to query matches."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-1">
              <div className="p-4 rounded-2xl bg-[#FBFAF7] border border-border-subtle/60">
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold block mb-1">Email Connection</span>
                <span className="text-sm text-text-primary font-bold truncate block">{customer.email || "Not registered"}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#FBFAF7] border border-border-subtle/60">
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold block mb-1">Phone Number</span>
                <span className="text-sm text-text-primary font-bold block">{customer.phoneNumber || "Not shared"}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "personal" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matrimonial background */}
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-bold tracking-widest text-text-primary uppercase border-b border-border-subtle/50 pb-2">Matrimonial Metrics</h4>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Religion</span>
                  <span className="text-sm text-text-primary font-bold capitalize">{customer.religion || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Caste</span>
                  <span className="text-sm text-text-primary font-bold capitalize">{customer.caste || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Gotra</span>
                  <span className="text-sm text-text-primary font-bold">{customer.gotra || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Mother Tongue</span>
                  <span className="text-sm text-text-primary font-bold">{customer.motherTongue || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Marital Status</span>
                  <span className="text-sm text-text-primary font-bold capitalize">{customer.maritalStatus?.replace("_", " ") || "Never Married"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Manglik Status</span>
                  <span className="text-sm text-text-primary font-bold capitalize">{customer.manglik || "No"}</span>
                </div>
              </div>
            </div>

            {/* Profession & Education */}
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-bold tracking-widest text-text-primary uppercase border-b border-border-subtle/50 pb-2">Education & Profession</h4>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg bg-[#FBFAF7] flex items-center justify-center border border-border-subtle text-text-muted shrink-0">
                    <GraduationCap className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted font-bold uppercase block">Education</span>
                    <span className="text-xs text-text-primary font-bold leading-normal">
                      {customer.degree ? `${customer.degree} ${customer.undergradCollege ? `at ${customer.undergradCollege}` : ""}` : "Not specified"}
                      {customer.postgradDegree && `, ${customer.postgradDegree} ${customer.postgradCollege ? `from ${customer.postgradCollege}` : ""}`}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg bg-[#FBFAF7] flex items-center justify-center border border-border-subtle text-text-muted shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted font-bold uppercase block">Career Status</span>
                    <span className="text-xs text-text-primary font-bold leading-normal">
                      {customer.designation ? `${customer.designation} ${customer.currentCompany ? `at ${customer.currentCompany}` : ""}` : "Unspecified"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg bg-[#FBFAF7] flex items-center justify-center border border-border-subtle text-text-muted shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted font-bold uppercase block">Income Details</span>
                    <span className="text-xs text-text-primary font-bold">
                      {formatIncome(customer.incomeTier)} {customer.annualIncomeInr ? `(~₹${(customer.annualIncomeInr / 100000).toFixed(0)}L/yr)` : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "lifestyle" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Habits & Details */}
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-bold tracking-widest text-text-primary uppercase border-b border-border-subtle/50 pb-2">Diet & Lifestyle</h4>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Diet Preference</span>
                  <span className="text-sm text-text-primary font-bold capitalize">{customer.diet?.replace("_", " ") || "Veg"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Drinking</span>
                  <span className="text-sm text-text-primary font-bold capitalize">{customer.drinking || "No"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Smoking</span>
                  <span className="text-sm text-text-primary font-bold capitalize">{customer.smoking || "No"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Height / Weight</span>
                  <span className="text-sm text-text-primary font-bold">
                    {customer.heightCm ? `${customer.heightCm} cm` : "N/A"} / {customer.weightKg ? `${customer.weightKg} kg` : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Family setup */}
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-bold tracking-widest text-text-primary uppercase border-b border-border-subtle/50 pb-2">Family Values</h4>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Family Setup</span>
                  <span className="text-sm text-text-primary font-bold capitalize">{customer.familyType || "Nuclear"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Family Values</span>
                  <span className="text-sm text-text-primary font-bold capitalize">{customer.familyValues || "Moderate"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Horoscope Needed</span>
                  <span className="text-sm text-text-primary font-bold">{formatBoolean(customer.horoscopeRequired)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Number of Siblings</span>
                  <span className="text-sm text-text-primary font-bold">{customer.siblings ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Preferred Criteria */}
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-bold tracking-widest text-text-primary uppercase border-b border-border-subtle/50 pb-2">Preferred Partner Criteria</h4>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Age Limits</span>
                  <span className="text-sm text-text-primary font-bold">
                    {customer.preferredAgeMin || 18} - {customer.preferredAgeMax || 100} yrs
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Min Partner Height</span>
                  <span className="text-sm text-text-primary font-bold">
                    {customer.preferredHeightMin ? `${customer.preferredHeightMin} cm` : "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Relocation Status</span>
                  <span className="text-sm text-text-primary font-bold capitalize">{customer.openToRelocate || "Maybe"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold uppercase block">Settle Abroad</span>
                  <span className="text-sm text-text-primary font-bold">{formatBoolean(customer.willingToSettleAbroad)}</span>
                </div>
              </div>
            </div>

            {/* Partner Filters */}
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-bold tracking-widest text-text-primary uppercase border-b border-border-subtle/50 pb-2">Criteria Filters</h4>
              <div className="flex flex-col gap-2.5">
                <div>
                  <span className="text-[10px] text-text-muted font-bold block mb-0.5">Preferred Religion</span>
                  <span className="text-xs text-text-primary font-bold leading-normal">
                    {customer.preferredReligion && customer.preferredReligion.length > 0
                      ? customer.preferredReligion.join(", ")
                      : "Open to all"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold block mb-0.5">Preferred Castes</span>
                  <span className="text-xs text-text-primary font-bold leading-normal">
                    {customer.preferredCaste && customer.preferredCaste.length > 0
                      ? customer.preferredCaste.join(", ")
                      : "Open to all"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted font-bold block mb-0.5">Preferred Cities</span>
                  <span className="text-xs text-text-primary font-bold leading-normal">
                    {customer.preferredCity && customer.preferredCity.length > 0
                      ? customer.preferredCity.join(", ")
                      : "Open to any city"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
