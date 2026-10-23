"use client";

import Link from "next/link";
import { Compass, ArrowRight, Globe, Shield, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/60 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Compass className="h-6 w-6 text-amber-400" />
            <span>Voyage</span>
          </Link>
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link href="/login" className="hover:text-amber-400 transition-colors">Sign In</Link>
            <Link href="/signup" className="rounded-full bg-amber-400 px-4 py-2 text-slate-950 hover:bg-amber-300 transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-32 md:py-48 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-8 bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300 bg-clip-text text-transparent drop-shadow-lg">
            Your Journey, Our Marketplace
          </h1>
          <p className="text-lg md:text-2xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover curated travel experiences, secure bookings, and expert concierge support — all in one secure platform.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-8 py-4 text-lg font-bold text-slate-950 hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/20">
              Start Exploring <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-8 py-4 text-lg font-medium hover:bg-white/5 transition-colors backdrop-blur">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 grid md:grid-cols-3 gap-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm hover:bg-white/10 transition-colors">
          <Globe className="h-10 w-10 text-amber-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Global Destinations</h3>
          <p className="text-slate-300">Handpicked experiences across continents, from hidden beaches to iconic cities.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm hover:bg-white/10 transition-colors">
          <Shield className="h-10 w-10 text-amber-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Secure Booking</h3>
          <p className="text-slate-300">End-to-end encrypted payments and JWT-protected accounts for peace of mind.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm hover:bg-white/10 transition-colors">
          <Sparkles className="h-10 w-10 text-amber-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Expert Concierge</h3>
          <p className="text-slate-300">Personal travel designers help craft your perfect itinerary, 24/7 support.</p>
        </div>
      </section>

      <footer className="border-t border-white/5 mt-20 py-10 text-center text-sm text-slate-400">
        <p>© {new Date().getFullYear()} Voyage Travel Agency. All rights reserved.</p>
      </footer>
    </main>
  );
}
