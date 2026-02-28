"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 py-24 overflow-hidden">
      {/* Background: subtle grid + chart line feel */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--foreground) 1px, transparent 1px),
            linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute inset-0 opacity-[0.04]">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="var(--foreground)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            d="M0,60 Q120,40 240,55 T480,50 T720,65 T960,45 T1200,70 L1400,70"
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="1"
          />
          <path
            d="M0,120 Q200,100 400,115 T800,95 T1200,110 L1400,110"
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="1"
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[var(--foreground)] leading-tight">
          Automate Repetition. Build Time Freedom.
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
          MnTfree Futures System is designed to structure execution, not to
          predict markets.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            href="/analysis"
            className="inline-flex items-center justify-center rounded-md border border-blue-500/50 bg-blue-500/10 px-5 py-2.5 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            Start Analysis
          </Link>
          <Link
            href="#system-architecture"
            className="inline-flex items-center justify-center rounded-md border border-[var(--border)] bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--muted)] hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--muted)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            View System Structure
          </Link>
          <Link
            href="#risk"
            className="inline-flex items-center justify-center rounded-md border border-[var(--border)] bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--muted)] hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--muted)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            Risk Framework
          </Link>
        </div>
      </div>
    </section>
  );
}
