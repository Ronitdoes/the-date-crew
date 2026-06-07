"use client";

import React, { useState } from "react";
import { 
  Heart, 
  MapPin, 
  Briefcase, 
  Sparkles, 
  Mail, 
  Trash2,
  GraduationCap,
  Loader2
} from "lucide-react";
import { api } from "@/lib/api";

interface CandidateProfile {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  age: number;
  city: string;
  religion?: string | null;
  caste?: string | null;
  diet?: string | null;
  incomeTier?: string | null;
  currentCompany?: string | null;
  designation?: string | null;
  degree?: string | null;
  undergradCollege?: string | null;
}

interface MatchItem {
  matchActionId: string;
  algoScore: number;
  action: string;
  aiLabel: "High Potential" | "Good Fit" | "Compatible" | "Tentative";
  aiReasoning: string;
  profile: CandidateProfile;
}

interface MatchCardProps {
  match: MatchItem;
  customerId: string;
  onRejectSuccess: (matchActionId: string) => void;
  onOpenDraft: (match: MatchItem) => void;
}

export default function MatchCard({
  match,
  customerId,
  onRejectSuccess,
  onOpenDraft
}: MatchCardProps) {
  const { matchActionId, algoScore, aiLabel, aiReasoning, profile } = match;
  const [rejecting, setRejecting] = useState(false);

  const handleReject = async () => {
    setRejecting(true);
    try {
      await api.post(`/matches/${matchActionId}/reject`);
      onRejectSuccess(matchActionId);
    } catch (err) {
      console.error("Failed to reject match:", err);
      alert("Failed to reject match suggestion. Please try again.");
    } finally {
      setRejecting(false);
    }
  };

  const getLabelColors = (label: string) => {
    switch (label) {
      case "High Potential":
        return {
          border: "border-l-soft-purple border-border-subtle",
          text: "text-[#8b5cf6] bg-soft-purple/15 border-soft-purple/20",
          ring: "stroke-[#8b5cf6]",
          bg: "from-soft-purple/5 to-transparent",
        };
      case "Good Fit":
        return {
          border: "border-l-soft-green border-border-subtle",
          text: "text-[#10b981] bg-soft-green/15 border-soft-green/20",
          ring: "stroke-[#10b981]",
          bg: "from-soft-green/5 to-transparent",
        };
      case "Compatible":
        return {
          border: "border-l-soft-blue border-border-subtle",
          text: "text-[#3b82f6] bg-soft-blue/15 border-soft-blue/25",
          ring: "stroke-[#3b82f6]",
          bg: "from-soft-blue/5 to-transparent",
        };
      default:
        return {
          border: "border-l-text-muted border-border-subtle",
          text: "text-text-muted bg-charcoal/10 border-border-subtle",
          ring: "stroke-text-muted",
          bg: "from-charcoal/5 to-transparent",
        };
    }
  };

  const colors = getLabelColors(aiLabel);

  const getAvatarPhoto = (candidate: CandidateProfile) => {
    // Matched index falls back to dynamic avatar illustrations
    const femaleAvatars = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
    ];
    const maleAvatars = [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
    ];

    const idx = candidate.firstName.charCodeAt(0) % 2;
    return candidate.gender === "female" ? femaleAvatars[idx] : maleAvatars[idx];
  };

  return (
    <div className={`w-full rounded-[24px] border border-border-subtle border-l-[6px] ${colors.border} bg-white p-5 md:p-6 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-all duration-300 bg-gradient-to-r ${colors.bg}`}>
      
      {/* 1. Profile information */}
      <div className="flex-1 flex gap-4 items-start">
        <div className="w-12 h-12 rounded-full border border-border-subtle shrink-0 overflow-hidden shadow-sm">
          <img 
            src={getAvatarPhoto(profile)} 
            alt={profile.firstName} 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-base font-bold text-text-primary font-sans leading-none">
              {profile.firstName} {profile.lastName}
            </h4>
            <span className="text-border-subtle text-xs">•</span>
            <span className="text-xs text-text-secondary font-semibold font-sans">
              {profile.age} Yrs, {profile.city}
            </span>
          </div>

          <p className="text-xs text-text-secondary font-medium leading-relaxed font-sans line-clamp-2">
            {profile.degree ? `${profile.degree} ` : ""}
            {profile.undergradCollege ? `from ${profile.undergradCollege} ` : ""}
            {profile.designation ? `• Work as ${profile.designation} ` : ""}
            {profile.currentCompany ? `at ${profile.currentCompany} ` : ""}
          </p>

          <div className="flex flex-wrap gap-1.5 mt-1">
            {profile.religion && (
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-accent-surface/30 border border-border-subtle text-text-primary">
                {profile.religion}
              </span>
            )}
            {profile.caste && (
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-accent-surface/30 border border-border-subtle text-text-primary">
                {profile.caste}
              </span>
            )}
            {profile.diet && (
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-accent-surface/30 border border-border-subtle text-text-primary">
                {profile.diet}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Score breakdown & AI Match rating */}
      <div className="md:w-64 shrink-0 flex flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-border-subtle/50 pt-4 md:pt-0 md:pl-6">
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border border-border-subtle/50 ${colors.text} inline-block w-fit`}>
              {aiLabel}
            </span>
            <span className="text-[11px] text-text-muted font-bold font-sans mt-1">Match Compatibility</span>
          </div>

          {/* SVG Score Circle */}
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-border-subtle"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${colors.ring} transition-all duration-1000`}
                strokeDasharray={`${algoScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-bold text-text-primary font-sans">
              {algoScore}%
            </span>
          </div>
        </div>

        {/* AI description */}
        <div className="p-3 rounded-2xl bg-[#FBFAF7] border border-border-subtle/60 text-[11px] leading-relaxed text-text-primary italic font-medium flex items-start gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-soft-purple shrink-0 mt-0.5" />
          <span>{aiReasoning}</span>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2.5 mt-1">
          <button
            onClick={() => onOpenDraft(match)}
            className="flex-1 h-9 rounded-full bg-soft-purple hover:bg-soft-purple/90 text-white font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Draft Email</span>
          </button>

          <button
            onClick={handleReject}
            disabled={rejecting}
            className="w-9 h-9 rounded-full border border-border-subtle hover:border-red-200 bg-[#FBFAF7] hover:bg-red-50 text-text-muted hover:text-red-600 flex items-center justify-center cursor-pointer transition-all disabled:opacity-50 shrink-0 shadow-sm"
            title="Reject match"
          >
            {rejecting ? (
              <Loader2 className="w-4 h-4 animate-spin text-soft-purple" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
