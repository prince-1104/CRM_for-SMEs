"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  FileText,
  IndianRupee,
  Receipt,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Receipt, label: "GST-ready invoices" },
  { icon: Users, label: "Multi-tenant" },
  { icon: IndianRupee, label: "Payment tracking" },
  { icon: Shield, label: "Secure & private" },
] as const;

function FloatingCard({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "landing-float-card absolute rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-xl",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export function LandingPage() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const onMove = (e: MouseEvent) => {
      const rect = scene.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const x = (e.clientX - cx) / (rect.width / 2);
      const y = (e.clientY - cy) / (rect.height / 2);
      setTilt({
        x: Math.max(-1, Math.min(1, y)) * 8,
        y: Math.max(-1, Math.min(1, x)) * -8,
      });
    };

    const onLeave = () => setTilt({ x: 0, y: 0 });

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div className="landing-scene relative min-h-screen overflow-hidden">
      {/* Ambient mesh background */}
      <div className="landing-mesh pointer-events-none absolute inset-0" aria-hidden />
      <div className="landing-grid pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />

      {/* Floating orbs */}
      <div className="landing-orb landing-orb-1" aria-hidden />
      <div className="landing-orb landing-orb-2" aria-hidden />
      <div className="landing-orb landing-orb-3" aria-hidden />

      {/* 3D scene layer */}
      <div
        ref={sceneRef}
        className="landing-perspective pointer-events-none absolute inset-0 hidden lg:block"
        aria-hidden
      >
        <div
          className="landing-3d-stage absolute inset-0 transition-transform duration-500 ease-out"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          }}
        >
          <FloatingCard
            className="landing-card-a left-[8%] top-[18%] w-52"
            style={{ transform: "translateZ(60px) rotateY(12deg)" }}
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40">Invoice</p>
                <p className="text-sm font-semibold text-white/90">#INV-0042</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-white/10" />
              <div className="h-1.5 w-4/5 rounded-full bg-white/10" />
              <div className="h-1.5 w-3/5 rounded-full bg-white/10" />
            </div>
            <p className="mt-3 text-right text-lg font-bold text-primary">₹24,500</p>
          </FloatingCard>

          <FloatingCard
            className="landing-card-b right-[10%] top-[22%] w-44"
            style={{ transform: "translateZ(120px) rotateY(-18deg)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">Paid</span>
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                GST 18%
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">₹1.2L</p>
            <p className="text-xs text-white/40">This month</p>
          </FloatingCard>

          <FloatingCard
            className="landing-card-c bottom-[22%] left-[14%] w-40"
            style={{ transform: "translateZ(40px) rotateX(8deg) rotateY(6deg)" }}
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-medium text-white/80">Quotation sent</span>
            </div>
            <p className="mt-1 text-[10px] text-white/40">2 min ago</p>
          </FloatingCard>

          <FloatingCard
            className="landing-card-d bottom-[28%] right-[12%] w-48"
            style={{ transform: "translateZ(90px) rotateY(-10deg)" }}
          >
            <p className="text-[10px] uppercase tracking-wider text-white/40">Clients</p>
            <p className="text-3xl font-bold text-white">128</p>
            <div className="mt-2 flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-6 w-6 rounded-full border-2 border-[#0d1117] bg-gradient-to-br from-primary/60 to-emerald-700"
                />
              ))}
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0d1117] bg-white/10 text-[8px] text-white/70">
                +12
              </div>
            </div>
          </FloatingCard>
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20">
        <div className="landing-hero-glass w-full max-w-2xl rounded-3xl border border-white/10 p-8 text-center shadow-2xl sm:p-12">
          <div className="landing-badge mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Built for Indian SMEs
          </div>

          <h1 className="landing-title text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Star Uniform
            <span className="mt-1 block text-2xl font-semibold text-white/70 sm:text-3xl">
              Billing &amp; Invoicing
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/55 sm:text-lg">
            Multi-tenant billing and GST-ready invoices for small businesses.
            Create, send, and track — all in one premium workspace.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/login"
              className="landing-cta-primary group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-8 text-sm font-semibold text-white transition-all sm:w-auto"
            >
              Log in
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/register"
              className="landing-cta-secondary inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-8 text-sm font-semibold text-white/90 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/[0.08] sm:w-auto"
            >
              Register
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 backdrop-blur-sm"
              >
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-medium leading-tight text-white/50">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-xs text-white/25">
          Trusted by businesses across India · GST compliant · Secure by default
        </p>
      </div>
    </div>
  );
}
