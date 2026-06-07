"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Mail, 
  Send, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";

interface CandidateProfile {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  age: number;
  city: string;
}

interface MatchItem {
  matchActionId: string;
  algoScore: number;
  action: string;
  aiLabel: string;
  aiReasoning: string;
  profile: CandidateProfile;
}

interface SendMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchItem | null;
  customerId: string;
  customerEmail: string;
  onSendSuccess: (matchActionId: string) => void;
}

export default function SendMatchModal({
  isOpen,
  onClose,
  match,
  customerId,
  customerEmail,
  onSendSuccess
}: SendMatchModalProps) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (isOpen && match) {
      generateDraft();
    }
  }, [isOpen, match]);

  const generateDraft = async () => {
    if (!match) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/ai/intro-email", {
        customerId,
        poolProfileId: match.profile.id
      });
      const data = res.data.data;
      setSubject(data.subject || `Introducing ${match.profile.firstName} — A Potential Match`);
      setBody(data.body || "");
    } catch (err: any) {
      console.error("Failed to generate draft:", err);
      setError("AI generation failed or rate limit reached. Fallback draft populated.");
      
      // Local fallback template
      setSubject(`Introducing ${match.profile.firstName} — A Potential Match from The Date Crew`);
      setBody(
        `Hi,\n\nWe've found a great candidate in our active pool who shares key values with you. Let us know if you'd like us to share more details about ${match.profile.firstName}.\n\nBest,\nYour Matchmaker`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!match) return;
    setSending(true);
    setError(null);
    try {
      await api.post(`/matches/${match.matchActionId}/send`);
      
      // Open Gmail compose window with prefilled to, subject, and body
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(customerEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(gmailUrl, "_blank", "noopener,noreferrer");

      onSendSuccess(match.matchActionId);
      onClose();
    } catch (err: any) {
      console.error("Failed to send match recommendation:", err);
      setError(err.response?.data?.error?.message || "Failed to finalize match transmission.");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !match) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md px-4">
      <div className="w-full max-w-2xl bg-white border border-border-subtle rounded-[28px] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-border-subtle/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-soft-purple/10 border border-soft-purple/20 flex items-center justify-center">
              <Mail className="w-4.5 h-4.5 text-soft-purple" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Draft Recommendations</h3>
              <p className="text-xs text-text-muted font-sans font-semibold mt-0.5">
                Introducing candidate {match.profile.firstName} to client
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-border-subtle bg-white flex items-center justify-center text-text-muted hover:text-text-primary cursor-pointer hover:bg-[#FBFAF7] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {error && (
            <div className="p-4 rounded-2xl bg-soft-purple/15 border border-soft-purple/30 text-text-primary text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#7c3aed]" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-24 flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-soft-purple animate-spin" />
              <div className="text-center">
                <p className="text-xs text-[#7c3aed] tracking-wider uppercase font-bold">Generating outreach email</p>
                <p className="text-[11px] text-text-muted font-sans mt-0.5 font-semibold">Gemini is structuring the compatibility writeup...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Subject Line */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold tracking-widest text-text-primary uppercase">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border-subtle bg-[#FBFAF7] text-text-primary text-sm font-semibold outline-none focus:border-warm-yellow focus:bg-white transition-all shadow-sm"
                />
              </div>

              {/* Body Textarea */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold tracking-widest text-text-primary uppercase">
                  Personalized Pitch (AI Generated)
                </label>
                <textarea
                  value={body}
                  rows={10}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-border-subtle bg-[#FBFAF7] text-text-primary text-xs font-semibold outline-none focus:border-warm-yellow focus:bg-white transition-all resize-none leading-relaxed shadow-sm font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer actions */}
        <div className="p-6 border-t border-border-subtle/50 bg-[#FBFAF7] flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 h-10 rounded-full border border-border-subtle bg-white hover:bg-accent-surface/20 text-text-secondary hover:text-text-primary text-xs font-bold tracking-wider cursor-pointer transition-colors shadow-sm"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSend}
            disabled={loading || sending || !body}
            className="px-6 h-10 rounded-full bg-soft-purple hover:bg-soft-purple/90 disabled:opacity-50 text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Transmitting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Recommendation</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
