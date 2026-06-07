"use client";

import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

interface PreloaderProps {
  hydrated: boolean;
  onComplete: () => void;
}

export default function Preloader({ hydrated, onComplete }: PreloaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const heartRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLSpanElement>(null);
  const panel1Ref = useRef<HTMLDivElement>(null);
  const panel2Ref = useRef<HTMLDivElement>(null);
  const panel3Ref = useRef<HTMLDivElement>(null);

  // 1. Logo Intro Animation on Mount
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const introTl = gsap.timeline();

      // Immediately animate heart icon: opacity 0 -> 1, scale 0.8 -> 1, duration 1s
      introTl.fromTo(
        heartRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 1.0, ease: "power3.out" }
      );

      // Immediately animate wordmark: opacity 0 -> 1, y 20 -> 0, duration 1s
      introTl.fromTo(
        wordmarkRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.0, ease: "power3.out" },
        "<" // Start simultaneously with heart icon
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // 2. Logo Exit & Curtain Animations when hydrated === true
  useLayoutEffect(() => {
    if (!hydrated) return;

    const ctx = gsap.context(() => {
      const exitTl = gsap.timeline({
        onComplete: () => {
          if (onComplete) {
            onComplete();
          }
        },
      });

      // Trigger curtain animations (sliding down translateY(100%), faster: 0.8s)
      // Panel 1: translateY(100%), duration: 0.8s
      exitTl.to(
        panel1Ref.current,
        {
          y: "100%",
          duration: 0.8,
          ease: "power4.inOut",
        }
      );

      // Panel 2: Starts when Panel 1 reaches approx 40% (duration 0.8 - 0.48 = 0.32s)
      exitTl.to(
        panel2Ref.current,
        {
          y: "100%",
          duration: 0.8,
          ease: "power4.inOut",
        },
        "-=0.48"
      );

      // Panel 3: Starts when Panel 2 reaches approx 40% (duration 0.8 - 0.48 = 0.32s)
      exitTl.to(
        panel3Ref.current,
        {
          y: "100%",
          duration: 0.8,
          ease: "power4.inOut",
        },
        "-=0.48"
      );
    }, containerRef);

    return () => ctx.revert();
  }, [hydrated, onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] overflow-hidden select-none flex items-center justify-center"
    >
      {/* Curtain Panels Layer (Serving as the purple background) */}
      <div className="absolute inset-0 flex z-40 pointer-events-none">
        <div
          ref={panel1Ref}
          className="flex-1 h-full bg-[#F4F1FB] transform translate-y-0"
        />
        <div
          ref={panel2Ref}
          className="flex-1 h-full bg-[#F4F1FB] transform translate-y-0 relative flex flex-col items-center justify-center gap-4"
        >
          {/* Heart icon circular wrapper */}
          <div
            ref={heartRef}
            className="w-12 h-12 rounded-full bg-soft-purple/10 border border-soft-purple/20 flex items-center justify-center shadow-[0_1px_6px_rgba(0,0,0,0.01)]"
          >
            <span className="text-soft-purple text-base">♥</span>
          </div>

          {/* Brand wordmark */}
          <span
            ref={wordmarkRef}
            className="font-sans text-[15px] tracking-[0.15em] font-semibold uppercase text-text-primary whitespace-nowrap"
          >
            The Date Crew
          </span>
        </div>
        <div
          ref={panel3Ref}
          className="flex-1 h-full bg-[#F4F1FB] transform translate-y-0"
        />
      </div>
    </div>
  );
}
