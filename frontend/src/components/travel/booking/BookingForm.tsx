"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, MapPin, Plane, Hotel, Compass, Loader2, Shield, CheckCircle2, AlertCircle, CreditCard, RotateCcw, X, Minus, Plus } from "lucide-react";
import { getToken } from "@/lib/session";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://127.0.0.1:8000";

const tabConfig = [
  { id: "experiences", label: "Experiences", icon: Compass },
  { id: "stays", label: "Stays", icon: Hotel },
  { id: "flights", label: "Flights", icon: Plane },
];

const experienceCategories = ["All", "Private Escapes", "Cultural Journeys", "Island Retreats", "Adventure", "Wellness"];
const stayCategories = ["All", "Luxury Hotels", "Private Villas", "Overwater Bungalows", "Safari Lodges", "Boutique Properties"];
const cabinClasses = ["Economy", "Premium Economy", "Business", "First"];

interface SearchParamsType {
  experiences: { destination: string; category: string; dates: string; travelers: string };
  stays: { destination: string; checkIn: string; checkOut: string; guests: string; rooms: string; category: string };
  flights: { origin: string; destination: string; departureDate: string; returnDate: string; passengers: string; cabinClass: string; directOnly: boolean };
}

interface ContactFields {
  fullName: string;
  email: string;
  phone: string;
}

interface PayableDestination {
  id: string;
  title: string;
  price: number | null;
  currency: string;
}

type Feedback =
  | { type: "success"; message: string; bookingId?: string }
  | { type: "error"; message: string; fieldErrors?: Record<string, string> }
  | null;

const EMPTY_SEARCH: SearchParamsType = {
  experiences: { destination: "", category: "All", dates: "", travelers: "2" },
  stays: { destination: "", checkIn: "", checkOut: "", guests: "2", rooms: "1", category: "All" },
  flights: { origin: "", destination: "", departureDate: "", returnDate: "", passengers: "1", cabinClass: "Economy", directOnly: false },
};

/** localStorage draft key — per-tenant booking drafts. */
const DRAFT_KEY_PREFIX = "booking_draft_";

interface DraftPayload {
  searchParams: SearchParamsType;
  contact: ContactFields;
  activeTab: string;
  savedAt: number;
}

const DRAFT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 3; // 3 days

function loadDraft(tenant: string): DraftPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY_PREFIX + tenant);
    if (!raw) return null;
    const draft = JSON.parse(raw) as DraftPayload;
    if (!draft?.savedAt || Date.now() - draft.savedAt > DRAFT_MAX_AGE_MS) {
      localStorage.removeItem(DRAFT_KEY_PREFIX + tenant);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

function clearDraft(tenant: string): void {
  try {
    localStorage.removeItem(DRAFT_KEY_PREFIX + tenant);
  } catch {
    // ignore
  }
}

export function BookingForm() {
  const pathname = usePathname();
  // tenant is the first path segment ("/demo/booking" -> "demo")
  const tenant = useMemo(() => pathname.split("/").filter(Boolean)[0] ?? "demo", [pathname]);

  // Restore a saved draft (once, on mount) before wiring autosave
  const [initialDraft] = useState(() => loadDraft(tenant));

  const [activeTab, setActiveTab] = useState(initialDraft?.activeTab ?? "experiences");
  const [searchParams, setSearchParams] = useState<SearchParamsType>(
    initialDraft?.searchParams ?? EMPTY_SEARCH
  );
  const [contact, setContact] = useState<ContactFields>(
    initialDraft?.contact ?? { fullName: "", email: "", phone: "" }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // --- Stripe checkout state ---
  const [payDestinations, setPayDestinations] = useState<PayableDestination[]>([]);
  const [destinationsLoading, setDestinationsLoading] = useState(true);
  const [payDestinationId, setPayDestinationId] = useState<string>("");
  const [payTravelers, setPayTravelers] = useState<string>("1");
  const [payDate, setPayDate] = useState<string>("");
  const [isPaying, setIsPaying] = useState(false);

  const selectedPayable = payDestinations.find((d) => d.id === payDestinationId);
  const payTotal =
    selectedPayable && selectedPayable.price != null
      ? selectedPayable.price * Number(payTravelers)
      : null;

  // Fetch payable destinations (priced ones from the live DB)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/destinations?tenant_id=${encodeURIComponent(tenant)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const rows = (await res.json()) as PayableDestination[];
        if (!cancelled) {
          setPayDestinations(rows.filter((r) => r.price != null));
        }
      } catch {
        // Checkout silently unavailable; lead-gen form still works.
      } finally {
        if (!cancelled) setDestinationsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenant]);

  // --- Draft autosave: debounce form state to localStorage (3-day TTL) ---
  const hasDraft = initialDraft !== null;
  const [draftRestored, setDraftRestored] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  useEffect(() => {
    if (draftRestored) return;
    if (hasDraft) setShowDraftBanner(true);
    setDraftRestored(true);
  }, [draftRestored, hasDraft]);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY_PREFIX + tenant,
          JSON.stringify({ searchParams, contact, activeTab, savedAt: Date.now() } satisfies DraftPayload)
        );
      } catch {
        // Storage blocked — drafts are a bonus, not a requirement
      }
    }, 600); // debounce
    return () => clearTimeout(t);
  }, [searchParams, contact, activeTab, tenant]);

  const updateSearchParam = (tab: keyof SearchParamsType, field: string, value: string | number | boolean) => {
    setSearchParams((prev) => {
      const newTabData: Record<string, unknown> = { ...prev[tab], [field]: value };
      return { ...prev, [tab]: newTabData as SearchParamsType[typeof tab] };
    });
  };

  // Map the current tab's UI state -> API payload
  const buildPayload = () => {
    const base = {
      tenantId: "demo",
      fullName: contact.fullName,
      email: contact.email,
      phone: contact.phone || undefined,
    };
    if (activeTab === "experiences") {
      const s = searchParams.experiences;
      return {
        ...base,
        bookingType: "experience" as const,
        destination: s.destination || undefined,
        travelers: s.travelers,
        startDate: s.dates?.match(/^\d{4}-\d{2}-\d{2}$/) ? s.dates : undefined,
        endDate: undefined,
        category: s.category && s.category !== "All" ? s.category : undefined,
        notes: s.dates ? `Preferred dates: ${s.dates}` : undefined,
      };
    }
    if (activeTab === "stays") {
      const s = searchParams.stays;
      return {
        ...base,
        bookingType: "stay" as const,
        destination: s.destination || undefined,
        travelers: s.guests,
        startDate: s.checkIn || undefined,
        endDate: s.checkOut || undefined,
        category: s.category && s.category !== "All" ? s.category : undefined,
        notes: s.rooms !== "1" ? `${s.rooms} rooms requested.` : undefined,
      };
    }
    const s = searchParams.flights;
    return {
      ...base,
      bookingType: "flight" as const,
      destination: s.destination || undefined,
      travelers: s.passengers,
      startDate: s.departureDate || undefined,
      endDate: s.returnDate || undefined,
      category: s.cabinClass,
      notes: `From: ${s.origin || "any"}${s.directOnly ? " | Direct flights only" : ""}`,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Client-side pre-check of required contact fields
    if (contact.fullName.trim().length < 2) {
      setFeedback({ type: "error", message: "Please fix the highlighted fields.", fieldErrors: { fullName: "Full name is required." } });
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email)) {
      setFeedback({ type: "error", message: "Please fix the highlighted fields.", fieldErrors: { email: "A valid email is required." } });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const json = (await res.json().catch(() => null)) as
        | { success: boolean; message?: string; error?: string; bookingId?: string; fieldErrors?: Record<string, string> }
        | null;

      if (res.ok && json?.success) {
        setFeedback({ type: "success", message: json.message ?? "Request received!", bookingId: json.bookingId });
        setSearchParams(EMPTY_SEARCH);
        setContact({ fullName: "", email: "", phone: "" });
        clearDraft(tenant); // submitted — draft no longer needed
      } else {
        setFeedback({
          type: "error",
          message: json?.error ?? "Something went wrong. Please try again.",
          fieldErrors: json?.fieldErrors,
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error — please check your connection and try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldError = (key: string) =>
    feedback?.type === "error" ? feedback.fieldErrors?.[key] : undefined;

  /**
   * Stripe Checkout: posts to our own /api/create-checkout-session proxy,
   * which calls the FastAPI backend server-side (amounts are validated there,
   * against the DB — never trusted from the client) and returns the Stripe
   * hosted-checkout URL.
   */
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPaying) return;
    setFeedback(null);

    if (!payDestinationId) {
      setFeedback({ type: "error", message: "Please choose a destination to book." });
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email)) {
      setFeedback({
        type: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: { email: "A valid email is required for your receipt." },
      });
      return;
    }
    if (payDate && !/^\d{4}-\d{2}-\d{2}$/.test(payDate)) {
      setFeedback({ type: "error", message: "Travel date must be a valid date." });
      return;
    }

    setIsPaying(true);
    try {
      // Forward the session JWT when present so the booking links to the
      // account; guests simply omit it. The proxy passes it to the backend.
      const token = getToken();
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tenantId: tenant,
          destinationId: payDestinationId,
          email: contact.email.trim(),
          travelers: Number(payTravelers),
          startDate: payDate || "",
          notes: contact.fullName ? `Booking for ${contact.fullName.trim()}` : "",
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; url?: string; error?: string }
        | null;

      if (res.ok && json?.success && json.url) {
        // Hand off to Stripe's hosted checkout
        window.location.href = json.url;
        return; // page navigates away
      }

      setFeedback({
        type: "error",
        message: json?.error ?? "Could not start checkout — please try again.",
      });
    } catch {
      setFeedback({ type: "error", message: "Network error — please check your connection and try again." });
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Card className="glass-card max-w-5xl mx-auto">
      {/* Draft-restored banner (dismissable) */}
      {showDraftBanner && (
        <div className="flex items-center justify-between gap-3 rounded-t-xl border-b border-accent/20 bg-accent/5 px-6 py-3">
          <p className="flex items-center gap-2 text-sm text-foreground" role="status">
            <RotateCcw className="h-4 w-4 text-accent" aria-hidden="true" />
            We restored your saved draft — pick up right where you left off.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                clearDraft(tenant);
                setSearchParams(EMPTY_SEARCH);
                setContact({ fullName: "", email: "", phone: "" });
                setShowDraftBanner(false);
              }}
              className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Start fresh
            </button>
            <button
              type="button"
              onClick={() => setShowDraftBanner(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label="Dismiss draft notice"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
      <CardHeader className="pb-4">
        <CardTitle className="heading-card">Plan Your Journey</CardTitle>
        <CardDescription className="body-base">
          Tell us how you travel — a designer will craft a proposal within 24 hours.
        </CardDescription>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50">
            {tabConfig.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-2 px-4 py-3 text-sm">
                <tab.icon className="w-4 h-4" aria-hidden="true" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {activeTab === "experiences" && (
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="exp-destination">Destination</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="exp-destination"
                      placeholder="Where do you want to go?"
                      value={searchParams.experiences.destination}
                      onChange={(e) => updateSearchParam("experiences", "destination", e.target.value)}
                      className="pl-12"
                      maxLength={200}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-category">Category</Label>
                  <Select value={searchParams.experiences.category} onValueChange={(v) => updateSearchParam("experiences", "category", v ?? "")}>
                    <SelectTrigger id="exp-category">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-travelers">Travelers</Label>
                  <Select value={searchParams.experiences.travelers} onValueChange={(v) => updateSearchParam("experiences", "travelers", v ?? "")}>
                    <SelectTrigger id="exp-travelers">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} Traveler{n > 1 ? "s" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-dates">Travel Dates</Label>
                <Input
                  id="exp-dates"
                  type="text"
                  placeholder="e.g., June 2026, Flexible dates"
                  value={searchParams.experiences.dates}
                  onChange={(e) => updateSearchParam("experiences", "dates", e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>
          )}

          {activeTab === "stays" && (
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="stay-destination">Destination</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="stay-destination"
                      placeholder="Where are you staying?"
                      value={searchParams.stays.destination}
                      onChange={(e) => updateSearchParam("stays", "destination", e.target.value)}
                      className="pl-12"
                      maxLength={200}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stay-checkin">Check-in</Label>
                  <Input
                    id="stay-checkin"
                    type="date"
                    value={searchParams.stays.checkIn}
                    onChange={(e) => updateSearchParam("stays", "checkIn", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stay-checkout">Check-out</Label>
                  <Input
                    id="stay-checkout"
                    type="date"
                    value={searchParams.stays.checkOut}
                    onChange={(e) => updateSearchParam("stays", "checkOut", e.target.value)}
                    min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                  />
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="stay-guests">Guests</Label>
                  <Select value={searchParams.stays.guests} onValueChange={(v) => updateSearchParam("stays", "guests", v ?? "")}>
                    <SelectTrigger id="stay-guests">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} Guest{n > 1 ? "s" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stay-rooms">Rooms</Label>
                  <Select value={searchParams.stays.rooms} onValueChange={(v) => updateSearchParam("stays", "rooms", v ?? "")}>
                    <SelectTrigger id="stay-rooms">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} Room{n > 1 ? "s" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="stay-category">Property Type</Label>
                  <Select value={searchParams.stays.category} onValueChange={(v) => updateSearchParam("stays", "category", v ?? "")}>
                    <SelectTrigger id="stay-category">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      {stayCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "flights" && (
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="flight-origin">From</Label>
                  <div className="relative">
                    <Plane className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="flight-origin"
                      placeholder="Origin airport/city"
                      value={searchParams.flights.origin}
                      onChange={(e) => updateSearchParam("flights", "origin", e.target.value)}
                      className="pl-12"
                      maxLength={200}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flight-destination">To</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="flight-destination"
                      placeholder="Destination airport/city"
                      value={searchParams.flights.destination}
                      onChange={(e) => updateSearchParam("flights", "destination", e.target.value)}
                      className="pl-12"
                      maxLength={200}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flight-departure">Departure</Label>
                  <Input
                    id="flight-departure"
                    type="date"
                    value={searchParams.flights.departureDate}
                    onChange={(e) => updateSearchParam("flights", "departureDate", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flight-return">Return (optional)</Label>
                  <Input
                    id="flight-return"
                    type="date"
                    value={searchParams.flights.returnDate}
                    onChange={(e) => updateSearchParam("flights", "returnDate", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="flight-passengers">Passengers</Label>
                  <Select value={searchParams.flights.passengers} onValueChange={(v) => updateSearchParam("flights", "passengers", v ?? "")}>
                    <SelectTrigger id="flight-passengers">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} Passenger{n > 1 ? "s" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flight-class">Cabin Class</Label>
                  <Select value={searchParams.flights.cabinClass} onValueChange={(v) => updateSearchParam("flights", "cabinClass", v ?? "")}>
                    <SelectTrigger id="flight-class">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cabinClasses.map((cls) => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 lg:col-span-2 flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={searchParams.flights.directOnly}
                      onChange={(e) => updateSearchParam("flights", "directOnly", String(e.target.checked))}
                      className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                    />
                    <span className="text-sm font-medium">Direct flights only</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Contact fields — required for a real booking lead */}
          <div className="border-t border-border pt-6 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Full Name *</Label>
                <Input
                  id="contact-name"
                  placeholder="Your full name"
                  value={contact.fullName}
                  onChange={(e) => setContact((c) => ({ ...c, fullName: e.target.value }))}
                  maxLength={200}
                  required
                  aria-invalid={!!fieldError("fullName")}
                  aria-describedby={fieldError("fullName") ? "contact-name-error" : undefined}
                />
                {fieldError("fullName") && (
                  <p id="contact-name-error" className="text-sm text-error flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> {fieldError("fullName")}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email *</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="you@example.com"
                  value={contact.email}
                  onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                  maxLength={320}
                  required
                  aria-invalid={!!fieldError("email")}
                  aria-describedby={fieldError("email") ? "contact-email-error" : undefined}
                />
                {fieldError("email") && (
                  <p id="contact-email-error" className="text-sm text-error flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> {fieldError("email")}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Phone (optional)</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  placeholder="+1 555 000 1234"
                  value={contact.phone}
                  onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                  maxLength={32}
                  aria-invalid={!!fieldError("phone")}
                />
                {fieldError("phone") && (
                  <p className="text-sm text-error flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> {fieldError("phone")}
                  </p>
                )}
              </div>
            </div>

            {/* Payment section — instant booking on priced destinations */}
          {!destinationsLoading && payDestinations.length > 0 && (
            <div className="border-t border-border pt-6 space-y-6">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-accent" aria-hidden="true" />
                <h3 className="heading-card text-foreground">Or Book &amp; Pay Instantly</h3>
              </div>
              <p className="text-sm text-muted-foreground -mt-3">
                Secure checkout via Stripe — your booking is confirmed the moment payment completes.
              </p>

              <form onSubmit={handleCheckout} className="space-y-4 rounded-xl border border-border bg-muted/20 p-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2 lg:col-span-2">
                    <Label htmlFor="pay-destination">Destination</Label>
                    <Select value={payDestinationId} onValueChange={(v) => setPayDestinationId(v ?? "")}>
                      <SelectTrigger id="pay-destination">
                        <SelectValue placeholder="Choose a destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {payDestinations.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.title} {d.price != null ? `(${d.currency} ${d.price.toLocaleString()})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label id="pay-travelers-label" htmlFor="pay-travelers-btns">
                      Travelers
                    </Label>
                    <div
                      id="pay-travelers-btns"
                      role="group"
                      aria-labelledby="pay-travelers-label"
                      className="flex h-10 items-center justify-between rounded-md border border-input bg-transparent px-2"
                    >
                      <button
                        type="button"
                        onClick={() => setPayTravelers((t) => String(Math.max(1, Number(t) - 1)))}
                        disabled={isPaying || payTravelers === "1"}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-foreground transition-all hover:bg-muted active:scale-90 disabled:opacity-40 disabled:hover:bg-transparent"
                        aria-label="Remove one traveler"
                      >
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={payTravelers}
                          className="min-w-6 text-center text-sm font-medium text-foreground"
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{ duration: 0.18 }}
                          aria-live="polite"
                        >
                          {payTravelers}
                        </motion.span>
                      </AnimatePresence>
                      <button
                        type="button"
                        onClick={() => setPayTravelers((t) => String(Math.min(6, Number(t) + 1)))}
                        disabled={isPaying || payTravelers === "6"}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-foreground transition-all hover:bg-muted active:scale-90 disabled:opacity-40 disabled:hover:bg-transparent"
                        aria-label="Add one traveler"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pay-date">Travel Date</Label>
                    <Input
                      id="pay-date"
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      disabled={isPaying}
                    />
                  </div>
                </div>

                {payTotal != null && selectedPayable && (
                  <div className="flex items-center justify-between rounded-lg bg-accent/5 border border-accent/20 px-4 py-3">
                    <span className="text-sm font-medium text-foreground">
                      Total ({payTravelers} traveler{Number(payTravelers) > 1 ? "s" : ""})
                    </span>
                    <span className="font-display text-lg font-medium text-accent">
                      {selectedPayable.currency} {payTotal.toLocaleString()}
                    </span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="outline"
                  className="btn-accent w-full sm:w-auto px-8 py-3.5"
                  disabled={isPaying || !payDestinationId}
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                      Redirecting to Secure Checkout...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" aria-hidden="true" />
                      Book &amp; Pay Now
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          <Button type="submit" className="btn-primary btn-shimmer w-full sm:w-auto px-10 py-4 text-lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                  Sending Request...
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5 mr-2" aria-hidden="true" />
                  Request My Journey
                </>
              )}
            </Button>
          </div>

          {/* Feedback banner (replaces fake toast system) */}
          {feedback?.type === "success" && (
            <div role="status" aria-live="polite" className="rounded-lg border border-success/30 bg-success-light p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-medium text-foreground">{feedback.message}</p>
                {feedback.bookingId && (
                  <p className="text-sm text-muted-foreground mt-1">Reference: {feedback.bookingId.slice(0, 8).toUpperCase()}</p>
                )}
              </div>
            </div>
          )}
          {feedback?.type === "error" && (
            <div role="alert" className="rounded-lg border border-error/30 bg-error-light p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" aria-hidden="true" />
              <p className="font-medium text-foreground">{feedback.message}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" aria-hidden="true" />
            Your details are encrypted in transit and never shared with third parties.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
