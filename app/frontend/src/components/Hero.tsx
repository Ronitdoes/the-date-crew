"use client";

import React, { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import SplitType from "split-type";

// Register the GSAP plugin for safe React lifecycle handling
gsap.registerPlugin(useGSAP);

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Text and outline animation refs
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const sparkTextRef = useRef<HTMLSpanElement>(null);
  const sparkContainerRef = useRef<HTMLSpanElement>(null);
  const rectRef = useRef<SVGRectElement>(null);
  const subheadingRef = useRef<HTMLParagraphElement>(null);

  // Spark hover reveal refs
  const sparkTextBlackWrapRef = useRef<HTMLDivElement>(null);
  const sparkTextBlackInnerRef = useRef<HTMLDivElement>(null);
  const sparkTextBlackRef = useRef<HTMLSpanElement>(null);
  const rectBlackRef = useRef<SVGRectElement>(null);

  // CTA Button refs
  const btnRef = useRef<HTMLAnchorElement>(null);
  const btnBgRef = useRef<HTMLDivElement>(null);
  const btnTextRef = useRef<HTMLSpanElement>(null);
  const btnArrow1Ref = useRef<HTMLSpanElement>(null);
  const btnArrow2Ref = useRef<HTMLSpanElement>(null);

  // GSAP animations configuration
  useGSAP((context, contextSafe) => {
    if (!contextSafe) return;
    if (
      !bgRef.current ||
      !contentRef.current ||
      !line1Ref.current ||
      !line2Ref.current ||
      !sparkTextRef.current ||
      !rectRef.current ||
      !sparkContainerRef.current ||
      !subheadingRef.current ||
      !btnRef.current
    )
      return;

    // 1. Measure the "Spark" text bounding box synchronously for perfect outline sizing
    const bbox = sparkTextRef.current.getBoundingClientRect();
    const strokeWidth = 3;
    const paddingX = 40; // Total horizontal padding (20px left, 20px right)
    const paddingY = 16; // Total vertical padding (8px top, 8px bottom)
    const width = bbox.width + paddingX;
    const height = bbox.height + paddingY;

    // Size the outline SVG container dynamically
    const svg = rectRef.current.ownerSVGElement;
    if (svg) {
      svg.setAttribute("width", width.toString());
      svg.setAttribute("height", height.toString());
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }

    const svgBlack = rectBlackRef.current?.ownerSVGElement;
    if (svgBlack) {
      svgBlack.setAttribute("width", width.toString());
      svgBlack.setAttribute("height", height.toString());
      svgBlack.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }

    // Size the black text wrapper inner container to match parent exactly
    if (sparkTextBlackInnerRef.current) {
      sparkTextBlackInnerRef.current.style.width = `${width}px`;
      sparkTextBlackInnerRef.current.style.height = `${height}px`;
    }

    // Set SVG rect coordinates and sizing for both white and black outlines
    rectRef.current.setAttribute("x", (strokeWidth / 2).toString());
    rectRef.current.setAttribute("y", (strokeWidth / 2).toString());
    rectRef.current.setAttribute("width", (width - strokeWidth).toString());
    rectRef.current.setAttribute("height", (height - strokeWidth).toString());

    if (rectBlackRef.current) {
      rectBlackRef.current.setAttribute("x", (strokeWidth / 2).toString());
      rectBlackRef.current.setAttribute("y", (strokeWidth / 2).toString());
      rectBlackRef.current.setAttribute("width", (width - strokeWidth).toString());
      rectBlackRef.current.setAttribute("height", (height - strokeWidth).toString());
    }

    // Calculate total length of the rounded-square path for the hand-drawn effect
    const length = rectRef.current.getTotalLength();
    rectRef.current.style.strokeDasharray = `${length}`;
    rectRef.current.style.strokeDashoffset = `${length}`;

    if (rectBlackRef.current) {
      const lengthBlack = rectBlackRef.current.getTotalLength();
      rectBlackRef.current.style.strokeDasharray = `${lengthBlack}`;
      rectBlackRef.current.style.strokeDashoffset = `${lengthBlack}`;
    }

    // 2. Perform text splitting for lines and characters
    const split1 = new SplitType(line1Ref.current, { types: "chars" });
    const split2 = new SplitType(line2Ref.current, { types: "chars" });
    const splitSpark = new SplitType(sparkTextRef.current, { types: "chars" });
    const splitSparkBlack = new SplitType(sparkTextBlackRef.current!, { types: "chars" });

    // Ensure split arrays exist
    const chars1 = split1.chars || [];
    const chars2 = split2.chars || [];
    const charsSpark = splitSpark.chars || [];
    const charsSparkBlack = splitSparkBlack.chars || [];

    // 3. Setup initial hidden states to prevent layout shifts/flashes
    gsap.set([chars1, chars2, charsSpark, charsSparkBlack], {
      opacity: 0,
      y: 100,
      rotateX: 90,
      filter: "blur(10px)",
      transformOrigin: "center bottom -50px",
    });

    // 4. Sequence cinematic layout load and reveals via timeline
    const tl = gsap.timeline();

    // Fade-up whole content container
    tl.fromTo(
      contentRef.current,
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 1.0, ease: "power4.out" }
    );

    // Reveal Headline Line 1 characters
    if (chars1.length > 0) {
      tl.to(
        chars1,
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          filter: "blur(0px)",
          duration: 1.2,
          ease: "power4.out",
          stagger: 0.03,
        },
        "-=0.7"
      );
    }

    // Reveal Headline Line 2 and Spark characters
    const line2CharsCombined = [...chars2, ...charsSpark, ...charsSparkBlack];
    if (line2CharsCombined.length > 0) {
      tl.to(
        line2CharsCombined,
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          filter: "blur(0px)",
          duration: 1.2,
          ease: "power4.out",
          stagger: 0.03,
        },
        "-=0.9"
      );
    }

    // Hand-drawn SVG highlight outline around "Spark" for both white and black outlines
    tl.to(
      [rectRef.current, rectBlackRef.current],
      {
        strokeDashoffset: 0,
        duration: 0.8,
        ease: "power3.inOut",
      },
      "-=0.2"
    );

    // Pop scale effect on the highlight completes
    tl.to(
      sparkContainerRef.current,
      {
        scale: 1.08,
        duration: 0.4,
        ease: "back.out(2)",
      },
      "-=0.1"
    );

    // Autoplay Spark color wipe from white to black
    tl.to(
      sparkTextBlackWrapRef.current,
      {
        width: "100%",
        duration: 0.8,
        ease: "power3.inOut",
      },
      "-=0.1"
    );

    // Fade-in subheading (placed 0.3s after text finishes, aligning with layout timings)
    tl.fromTo(
      subheadingRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
      "-=0.2"
    );

    // Fade-in CTA Button
    tl.fromTo(
      btnRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
      "-=0.6"
    );

    // 5. Setup High-Performance Parallax effect on mouse move
    const bgX = gsap.quickTo(bgRef.current, "x", { duration: 1.0, ease: "power2.out" });
    const bgY = gsap.quickTo(bgRef.current, "y", { duration: 1.0, ease: "power2.out" });
    const contentX = gsap.quickTo(contentRef.current, "x", { duration: 1.0, ease: "power2.out" });
    const contentY = gsap.quickTo(contentRef.current, "y", { duration: 1.0, ease: "power2.out" });

    const handleMouseMove = contextSafe((e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      // Coordinate shift values (-0.5 to 0.5)
      const xMove = clientX / innerWidth - 0.5;
      const yMove = clientY / innerHeight - 0.5;

      // Subtle parallax shift (Bg shifts opposite, Content shifts same direction)
      bgX(xMove * -15);
      bgY(yMove * -15);
      contentX(xMove * 10);
      contentY(yMove * 10);
    });

    window.addEventListener("mousemove", handleMouseMove);

    // 5.1 Setup Spark Hover listeners
    const handleSparkEnter = contextSafe(() => {
      gsap.to(sparkContainerRef.current, {
        scale: 1.12,
        duration: 0.3,
        ease: "power2.out",
      });
    });

    const handleSparkLeave = contextSafe(() => {
      gsap.to(sparkContainerRef.current, {
        scale: 1.08,
        duration: 0.3,
        ease: "power2.out",
      });
    });

    const sparkNode = sparkContainerRef.current;
    if (sparkNode) {
      sparkNode.addEventListener("mouseenter", handleSparkEnter);
      sparkNode.addEventListener("mouseleave", handleSparkLeave);
    }

    // 6. Cleanup animations and split instances on component unmount
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (sparkNode) {
        sparkNode.removeEventListener("mouseenter", handleSparkEnter);
        sparkNode.removeEventListener("mouseleave", handleSparkLeave);
      }
      split1.revert();
      split2.revert();
      splitSpark.revert();
      splitSparkBlack.revert();
      tl.kill();
    };
  }, { scope: containerRef });

  // CTA Button interactions using contextSafe callbacks
  useGSAP((context, contextSafe) => {
    if (!contextSafe) return;
    if (!btnRef.current || !btnBgRef.current || !btnTextRef.current || !btnArrow1Ref.current || !btnArrow2Ref.current) return;

    // Hover Enter Interaction
    const handleMouseEnter = contextSafe(() => {
      // 1. Expand the liquid white background morphing to full pill (Slow: 0.8s)
      gsap.to(btnBgRef.current, {
        width: "100%",
        borderRadius: "9999px",
        duration: 0.8,
        ease: "power3.inOut",
      });

      // 2. Interpolate text styles (color and letter spacing) (Slow: 0.8s)
      gsap.to(btnTextRef.current, {
        color: "#000000",
        letterSpacing: "0.05em",
        duration: 0.8,
        ease: "power3.inOut",
      });

      // 3. Arrow 1 moves out to top-right
      gsap.to(btnArrow1Ref.current, {
        x: 20,
        y: -20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });

      // 4. Arrow 2 moves in from bottom-left
      gsap.to(btnArrow2Ref.current, {
        x: 0,
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
      });
    });

    // Hover Leave Interaction
    const handleMouseLeave = contextSafe(() => {
      // 1. Shrink background back to left and morph border radius (Slow: 0.8s)
      gsap.to(btnBgRef.current, {
        width: "0%",
        borderRadius: "100px 50px 50px 100px",
        duration: 0.8,
        ease: "power3.inOut",
      });

      // 2. Restore text styles (Slow: 0.8s)
      gsap.to(btnTextRef.current, {
        color: "#ffffff",
        letterSpacing: "0.025em",
        duration: 0.8,
        ease: "power3.inOut",
      });

      // 3. Arrow 1 returns to center
      gsap.to(btnArrow1Ref.current, {
        x: 0,
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
      });

      // 4. Arrow 2 returns to bottom-left
      gsap.to(btnArrow2Ref.current, {
        x: -20,
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });

      // 5. Elastic snap-back for magnetic button offsets
      gsap.to(btnRef.current, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "elastic.out(1.1, 0.4)",
      });

      gsap.to([btnTextRef.current, btnArrow1Ref.current, btnArrow2Ref.current], {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "elastic.out(1.1, 0.4)",
      });
    });

    // High-performance magnetic hover drag tracking
    const handleButtonMouseMove = contextSafe((e: MouseEvent) => {
      const btn = btnRef.current;
      if (!btn) return;
      
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Magnetic pull (35% coordinate attraction)
      gsap.to(btn, {
        x: x * 0.35,
        y: y * 0.35,
        duration: 0.4,
        ease: "power2.out",
      });

      // Inner text & arrow drift slightly less to create 3D visual depth
      gsap.to([btnTextRef.current, btnArrow1Ref.current, btnArrow2Ref.current], {
        x: x * 0.1,
        y: y * 0.1,
        duration: 0.4,
        ease: "power2.out",
      });
    });

    // Wire up event listeners
    const btnNode = btnRef.current;
    btnNode.addEventListener("mouseenter", handleMouseEnter);
    btnNode.addEventListener("mouseleave", handleMouseLeave);
    btnNode.addEventListener("mousemove", handleButtonMouseMove);

    return () => {
      btnNode.removeEventListener("mouseenter", handleMouseEnter);
      btnNode.removeEventListener("mouseleave", handleMouseLeave);
      btnNode.removeEventListener("mousemove", handleButtonMouseMove);
    };
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen flex items-center justify-center bg-[#9da1fc] overflow-hidden select-none"
    >
      {/* Background Image Layer — Mobile (heroMobile.avif) */}
      <div
        ref={bgRef}
        className="md:hidden absolute inset-0 w-full h-full bg-cover bg-center pointer-events-none select-none scale-[1.03]"
        style={{
          backgroundImage: "url('/heroMobile.avif')",
          willChange: "transform",
        }}
      />

      {/* Background Image Layer — Desktop (hero.avif) */}
      <div
        className="hidden md:block absolute inset-0 w-full h-full bg-cover bg-center pointer-events-none select-none scale-[1.03]"
        style={{
          backgroundImage: "url('/hero.avif')",
          willChange: "transform",
        }}
      />

      {/* Content Overlay */}
      <div
        ref={contentRef}
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto"
        style={{ willChange: "transform, opacity" }}
      >
        {/* Title / Headline */}
        <h1 className="font-absans text-[2.75rem] sm:text-6xl md:text-[5.5rem] lg:text-[6.5rem] font-normal leading-[1.1] text-white tracking-tight select-none flex flex-col items-center">
          {/* Line 1 */}
          <div ref={line1Ref} className="split-line-1 overflow-hidden py-1 block select-none">
            Discover, Match,
          </div>
          
          {/* Line 2 */}
          <div className="overflow-visible py-1 flex items-center flex-wrap justify-center select-none">
            <span ref={line2Ref} className="split-line-2 block select-none">
              & Find Your&nbsp;
            </span>
            <span
              ref={sparkContainerRef}
              className="relative inline-block px-5 py-2 select-none cursor-pointer group"
            >
              {/* Highlight SVGRect border behind word "Spark" */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10">
                <rect
                  ref={rectRef}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  rx="28"
                  ry="28"
                />
              </svg>



              {/* White Text word */}
              <span
                ref={sparkTextRef}
                className="split-spark relative z-10 font-bold select-none block text-white"
              >
                Spark
              </span>

              {/* Black Text word overlay */}
              <div
                ref={sparkTextBlackWrapRef}
                className="absolute top-0 left-0 h-full w-0 overflow-hidden z-20 pointer-events-none select-none"
              >
                <div
                  ref={sparkTextBlackInnerRef}
                  className="absolute top-0 left-0 h-full px-5 py-2 flex items-center justify-center overflow-visible"
                >
                  {/* Highlight SVGRect border behind word "Spark" (Black, clipped) */}
                  <svg className="absolute inset-0 pointer-events-none overflow-visible z-10">
                    <rect
                      ref={rectBlackRef}
                      fill="none"
                      stroke="#000000"
                      strokeWidth="3"
                      strokeLinecap="round"
                      rx="28"
                      ry="28"
                    />
                  </svg>

                  <span
                    ref={sparkTextBlackRef}
                    className="font-bold block text-black whitespace-nowrap relative z-20"
                  >
                    Spark
                  </span>
                </div>
              </div>
            </span>
          </div>
        </h1>

        {/* Subheading */}
        <p
          ref={subheadingRef}
          className="mt-8 md:mt-10 max-w-[600px] text-base md:text-lg text-white/85 font-normal leading-relaxed tracking-wide select-none"
        >
          Your profile. Your preferences. Your perfect match, handled with care.
        </p>

        {/* CTA Button Wrapper */}
        <div className="mt-8 md:mt-10 overflow-visible py-4 flex items-center justify-center">
          <Link
            href="/login"
            ref={btnRef}
            className="relative px-12 py-5 rounded-full border border-white/30 bg-white/5 backdrop-blur-md text-white font-semibold flex items-center gap-4 overflow-hidden select-none outline-none cursor-pointer"
          >
            {/* Morphing Liquid shape background (expands on hover) */}
            <div
              ref={btnBgRef}
              className="absolute top-0 left-0 h-full w-0 bg-white z-0"
              style={{
                borderRadius: "100px 50px 50px 100px",
                willChange: "width, border-radius",
              }}
            />

            {/* Content text */}
            <span
              ref={btnTextRef}
              className="relative z-10 tracking-wide font-sans select-none pointer-events-none text-xl"
            >
              Sign In
            </span>

            {/* Arrow icons wrapper */}
            <span className="relative z-10 inline-block w-6 h-6 overflow-hidden select-none pointer-events-none">
              {/* Arrow 1 */}
              <span
                ref={btnArrow1Ref}
                className="absolute inset-0 flex items-center justify-center font-sans text-2xl leading-none text-white z-10"
              >
                ↗
              </span>
              {/* Arrow 2 */}
              <span
                ref={btnArrow2Ref}
                className="absolute inset-0 flex items-center justify-center font-sans text-2xl leading-none text-black opacity-0 z-10"
                style={{ transform: "translate(-100%, 100%)" }}
              >
                ↗
              </span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
