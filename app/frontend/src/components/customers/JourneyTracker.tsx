"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Check, 
  ChevronDown,
  Loader2
} from "lucide-react";

interface JourneyTrackerProps {
  customerId: string;
  currentStage: string;
}

const STAGES = [
  { id: "onboarding", label: "Onboarding" },
  { id: "active", label: "Active Pool" },
  { id: "match_sent", label: "Match Sent" },
  { id: "matched", label: "Matched" },
  { id: "paused", label: "Paused" },
  { id: "closed", label: "Closed" },
];

export default function JourneyTracker({ customerId, currentStage }: JourneyTrackerProps) {
  const queryClient = useQueryClient();
  const [updatingStage, setUpdatingStage] = useState<string | null>(null);

  // Mutation to patch journey stage
  const stageMutation = useMutation({
    mutationFn: async (newStage: string) => {
      setUpdatingStage(newStage);
      const res = await api.patch(`/customers/${customerId}/stage`, {
        journeyStage: newStage
      });
      return res.data;
    },
    onSuccess: () => {
      // Invalidate queries to sync metrics
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onSettled: () => {
      setUpdatingStage(null);
    }
  });

  const getStageIndex = (stage: string) => {
    return STAGES.findIndex(s => s.id === stage);
  };

  const activeIndex = getStageIndex(currentStage);

  return (
    <div className="w-full p-6 rounded-[28px] bg-[#FBFAF7] border border-border-subtle shadow-[0_2px_12px_rgba(0,0,0,0.01)] flex flex-col gap-6">
      {/* Title / Action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xs font-bold tracking-widest text-text-primary uppercase">
            Client Journey tracker
          </h3>
          <p className="text-xs text-text-muted font-sans mt-0.5">
            Monitor match status and transition stages
          </p>
        </div>

        {/* Dropdown stage switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary font-sans font-semibold">Transition to:</span>
          <div className="relative shrink-0">
            <select
              value={currentStage}
              disabled={!!updatingStage}
              onChange={(e) => stageMutation.mutate(e.target.value)}
              className="h-9 pl-3 pr-8 rounded-full border border-border-subtle bg-white text-xs font-bold font-sans text-text-primary focus:border-warm-yellow cursor-pointer disabled:opacity-50 appearance-none outline-none shadow-sm"
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          </div>
          {updatingStage && <Loader2 className="w-4 h-4 text-soft-purple animate-spin" />}
        </div>
      </div>

      {/* 2. Visual Horizontal Stepper */}
      <div className="w-full py-4 overflow-x-auto scrollbar-none">
        <div className="flex items-center justify-between min-w-[640px] px-2 relative">
          
          {/* Timeline Connector Line */}
          <div className="absolute top-[21px] left-[5%] right-[5%] h-[2px] bg-border-subtle pointer-events-none z-0">
            <div 
              className="h-full bg-soft-purple transition-all duration-500 ease-in-out shadow-[0_0_8px_rgba(185,154,245,0.4)]"
              style={{ width: `${(Math.max(0, activeIndex) / (STAGES.length - 1)) * 100}%` }}
            />
          </div>

          {/* Stepper Node List */}
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < activeIndex;
            const isActive = idx === activeIndex;
            const isFuture = idx > activeIndex;

            return (
              <div 
                key={stage.id}
                onClick={() => !updatingStage && stageMutation.mutate(stage.id)}
                className="flex flex-col items-center gap-2.5 z-10 select-none cursor-pointer group shrink-0 w-[14%]"
              >
                {/* Node indicator */}
                <div 
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? "bg-soft-purple border-soft-purple text-white shadow-[0_0_10px_rgba(185,154,245,0.15)]"
                      : isActive
                        ? "bg-white border-soft-purple text-[#7c3aed] shadow-[0_0_10px_rgba(185,154,245,0.15)]"
                        : "bg-[#FBFAF7] border-border-subtle text-text-muted group-hover:border-text-secondary"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3px]" />
                  ) : (
                    <span className="text-xs font-bold">{idx + 1}</span>
                  )}
                </div>

                {/* Node details */}
                <span 
                  className={`text-xs font-semibold font-sans tracking-wide transition-colors ${
                    isActive 
                      ? "text-[#7c3aed] font-bold" 
                      : isCompleted 
                        ? "text-text-primary font-semibold" 
                        : "text-text-muted group-hover:text-text-secondary"
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
