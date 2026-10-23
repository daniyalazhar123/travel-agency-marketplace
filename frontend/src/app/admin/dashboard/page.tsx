"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Users, Ticket, TrendingUp, AlertTriangle } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }
      const userRaw = localStorage.getItem("user_info");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        const role = user.role ?? "";
        if (role === "platform_admin" || role === "agency_admin") {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } else {
        setAuthorized(true);
      }
    } catch {
      router.push("/login");
    }
  }, [router]);

  if (authorized === null) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p>Checking authorization...</p>
      </main>
    );
  }

  if (authorized === false) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center max-w-md px-6">
          <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
          <p className="text-slate-400">Your role does not have admin privileges. You may browse as a standard user.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-8 w-8 text-amber-400" />
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
        </div>
        <p className="text-slate-400 mb-10">Protected Route — Platform Overview</p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <Users className="h-8 w-8 text-amber-400 mb-4" />
            <h3 className="text-2xl font-bold">12,483</h3>
            <p className="text-slate-400 text-sm">Total Users</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <Ticket className="h-8 w-8 text-amber-400 mb-4" />
            <h3 className="text-2xl font-bold">8,291</h3>
            <p className="text-slate-400 text-sm">Total Bookings</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <TrendingUp className="h-8 w-8 text-amber-400 mb-4" />
            <h3 className="text-2xl font-bold">$1.24M</h3>
            <p className="text-slate-400 text-sm">Revenue</p>
          </div>
        </div>
      </div>
    </main>
  );
}
