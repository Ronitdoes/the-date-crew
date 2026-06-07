"use client";

import React, { useState, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import AppShell from "@/components/layout/AppShell";
import BiodataPanel from "@/components/profile/BiodataPanel";
import JourneyTracker from "@/components/customers/JourneyTracker";
import MatchCard from "@/components/matches/MatchCard";
import SendMatchModal from "@/components/matches/SendMatchModal";
import { 
  ArrowLeft, 
  Sparkles, 
  Plus, 
  Loader2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

interface CustomerPageProps {
  params: Promise<{ id: string }>;
}

interface Note {
  id: string;
  content: string;
  noteType: "general" | "call" | "meeting" | "email" | "observation";
  createdAt: string;
}

export default function CustomerDetailPage({ params }: CustomerPageProps) {
  // Unwrap Next.js App Router params
  const { id: customerId } = use(params);
  const queryClient = useQueryClient();

  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Note Form State
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<any>("general");
  const [noteError, setNoteError] = useState<string | null>(null);

  // 1. Fetch Client Biodata
  const { data: customerData, isLoading: loadingCustomer } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      const res = await api.get(`/customers/${customerId}`);
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes custom stale time
  });

  // 2. Query Suggested Match Candidates (Triggers algorithms + AI check on mount)
  const { data: matchesData, isLoading: loadingMatches, refetch: refetchMatches, isRefetching: refetchingMatches } = useQuery({
    queryKey: ["customer-matches", customerId],
    queryFn: async () => {
      const res = await api.post(`/customers/${customerId}/matches/run`);
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes custom stale time to prevent redundant AI match runs on mount
  });

  // 3. Query Client Work Logs/Notes
  const { data: notesData, isLoading: loadingNotes } = useQuery({
    queryKey: ["customer-notes", customerId],
    queryFn: async () => {
      const res = await api.get(`/customers/${customerId}/notes`);
      return res.data.data;
    },
  });

  // 4. Create Note Mutation
  const createNoteMutation = useMutation({
    mutationFn: async (payload: { content: string; noteType: string }) => {
      const res = await api.post(`/customers/${customerId}/notes`, payload);
      return res.data;
    },
    onSuccess: () => {
      setNoteContent("");
      setNoteType("general");
      queryClient.invalidateQueries({ queryKey: ["customer-notes", customerId] });
    },
    onError: (err: any) => {
      setNoteError(err.response?.data?.error?.message || "Failed to save log note.");
    }
  });

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setNoteError(null);
    createNoteMutation.mutate({ content: noteContent, noteType });
  };

  // Remove matching suggestion instantly on local client list without full invalidation
  const handleRejectSuccess = (matchActionId: string) => {
    queryClient.setQueryData(["customer-matches", customerId], (oldData: any) => {
      if (!oldData) return [];
      return oldData.filter((m: any) => m.matchActionId !== matchActionId);
    });
  };

  const handleSendSuccess = (matchActionId: string) => {
    queryClient.setQueryData(["customer-matches", customerId], (oldData: any) => {
      if (!oldData) return [];
      return oldData.filter((m: any) => m.matchActionId !== matchActionId);
    });
    // Invalidate statistics count
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  // Pagination logic
  const totalMatches = matchesData?.length ?? 0;
  const totalPages = Math.ceil(totalMatches / 2);
  const paginatedMatches = matchesData ? matchesData.slice((currentPage - 1) * 2, currentPage * 2) : [];

  React.useEffect(() => {
    if (currentPage > 1 && currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [totalMatches, totalPages, currentPage]);

  const getNoteTypeIcon = (type: string) => {
    switch (type) {
      case "call":
        return "📞";
      case "meeting":
        return "🤝";
      case "email":
        return "✉️";
      case "observation":
        return "💡";
      default:
        return "📝";
    }
  };

  if (loadingCustomer) {
    return (
      <AppShell>
        <div className="py-32 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-soft-purple animate-spin" />
          <p className="text-xs text-text-muted font-sans font-bold tracking-wide">Retrieving client record...</p>
        </div>
      </AppShell>
    );
  }

  if (!customerData) {
    return (
      <AppShell>
        <div className="p-6 rounded-[28px] bg-red-50 border border-red-200 text-center text-sm font-sans text-red-600 font-bold">
          Client profile not found, or access denied.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        
        {/* Navigation Breadcrumb header */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-full border border-border-subtle bg-white flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-[#FBFAF7] transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold block font-sans">
                Customer Workspace
              </span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mt-0.5">
              Client detail
            </h1>
          </div>
        </div>

        {/* 1. Journey Stage Progress Stepper */}
        <JourneyTracker customerId={customerId} currentStage={customerData.journeyStage} />

        {/* 2. Double-column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Biodata Sheets Panel (span 5) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <BiodataPanel customer={customerData} />
            
            {/* Embedded interactive notes workspace */}
            <div className="w-full flex flex-col gap-5 rounded-[28px] p-6 bg-white border border-border-subtle shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold tracking-widest text-text-primary uppercase">
                    Work Logs & Notes
                  </h3>
                  <p className="text-xs text-text-muted font-sans font-semibold mt-0.5">
                    Track followups and internal notes
                  </p>
                </div>
              </div>

              {/* Note creation form */}
              <form onSubmit={handleNoteSubmit} className="flex flex-col gap-3">
                <div className="relative shrink-0">
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value)}
                    className="h-10 pl-3 pr-8 rounded-xl border border-border-subtle bg-white text-xs font-bold font-sans text-text-primary focus:border-warm-yellow cursor-pointer appearance-none outline-none shadow-sm"
                  >
                    <option value="general">📝 General</option>
                    <option value="call">📞 Phone Call</option>
                    <option value="meeting">🤝 Meeting</option>
                    <option value="email">✉️ Outreach</option>
                    <option value="observation">💡 Observation</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                </div>

                <textarea
                  placeholder="Record call summary, client feedback, or matchmaking updates..."
                  rows={3}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  required
                  className="w-full p-4 rounded-2xl border border-border-subtle bg-[#FBFAF7] outline-none text-xs placeholder-text-muted/70 text-text-primary font-semibold leading-relaxed focus:bg-white resize-none shadow-sm transition-all"
                />

                {noteError && (
                  <span className="text-[11px] text-red-500 font-sans font-bold">{noteError}</span>
                )}

                <button
                  type="submit"
                  disabled={createNoteMutation.isPending || !noteContent.trim()}
                  className="w-full h-10 rounded-full bg-soft-purple text-white font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-sm hover:bg-soft-purple/90"
                >
                  {createNoteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add Work Log</span>
                    </>
                  )}
                </button>
              </form>

              {/* Notes List */}
              <div className="flex flex-col gap-3.5 mt-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border-subtle scrollbar-track-transparent">
                {loadingNotes ? (
                  <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 text-soft-purple animate-spin" /></div>
                ) : !notesData || notesData.length === 0 ? (
                  <p className="text-xs text-text-muted italic text-center py-6 font-semibold font-sans">No work logs registered yet.</p>
                ) : (
                  notesData.map((note: Note) => (
                    <div key={note.id} className="p-3.5 rounded-2xl bg-[#FBFAF7] border border-border-subtle/50 flex gap-3 shadow-sm">
                      <span className="text-base shrink-0 mt-0.5">{getNoteTypeIcon(note.noteType)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-primary font-medium font-sans leading-normal whitespace-pre-wrap">{note.content}</p>
                        <span className="text-[10px] text-text-muted font-bold font-sans mt-1.5 block">
                          {new Date(note.createdAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short"
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT: Match Suggestions Workspace (span 7) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-text-primary font-sans leading-none">
                  Matching Recommendations
                </h3>
                <p className="text-xs text-text-muted font-sans font-semibold mt-1">
                  AI compatible profiles from candidate pool
                </p>
              </div>

              {/* Regenerate Matches Trigger */}
              <button
                onClick={() => refetchMatches()}
                disabled={loadingMatches || refetchingMatches}
                className="h-10 px-4 rounded-full border border-border-subtle/80 bg-soft-purple/15 hover:bg-soft-purple/25 text-text-primary font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 shadow-sm"
              >
                {refetchingMatches || loadingMatches ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-soft-purple" />
                )}
                <span>Run Algorithms</span>
              </button>
            </div>

            {/* List suggested profiles */}
            {loadingMatches ? (
              <div className="py-32 flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-soft-purple animate-spin" />
                <div className="text-center">
                  <p className="text-xs text-[#7c3aed] uppercase tracking-widest font-bold">Running compatibilities</p>
                  <p className="text-[11px] text-text-muted font-semibold font-sans mt-0.5">Evaluating income, religion, and values alignment...</p>
                </div>
              </div>
            ) : !matchesData || matchesData.length === 0 ? (
              <div className="p-8 rounded-[24px] border border-border-subtle bg-[#FBFAF7] text-center py-16">
                <div className="w-12 h-12 rounded-full bg-white border border-border-subtle text-text-muted flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Sparkles className="w-5 h-5 text-soft-purple" />
                </div>
                <p className="text-text-primary font-bold font-sans">No new match candidates available</p>
                <p className="text-text-muted text-xs font-sans mt-1 max-w-sm mx-auto leading-normal font-semibold">
                  All active matching candidates have already been sent or rejected. Introduce new pool profiles to query new suggestions.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4.5">
                {paginatedMatches.map((match: any) => (
                  <MatchCard
                    key={match.matchActionId}
                    match={match}
                    customerId={customerId}
                    onRejectSuccess={handleRejectSuccess}
                    onOpenDraft={(m) => setSelectedMatch(m)}
                  />
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border border-border-subtle bg-[#FBFAF7] rounded-[24px] mt-2 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                    <span className="text-xs text-text-muted font-semibold">
                      Showing <span className="text-text-primary font-bold">{paginatedMatches.length}</span> of{" "}
                      <span className="text-text-primary font-bold">{totalMatches}</span> suggestions
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="w-8 h-8 rounded-full border border-border-subtle bg-white flex items-center justify-center text-text-primary disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:bg-accent-surface/20 transition-all shadow-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <span className="text-xs text-text-primary font-bold font-sans px-1">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="w-8 h-8 rounded-full border border-border-subtle bg-white flex items-center justify-center text-text-primary disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:bg-accent-surface/20 transition-all shadow-sm"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 3. Send/Transmit Match Modal Drawer */}
      <SendMatchModal
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        match={selectedMatch}
        customerId={customerId}
        customerEmail={customerData?.email || ""}
        onSendSuccess={handleSendSuccess}
      />
    </AppShell>
  );
}
