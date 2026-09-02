"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Plane, Hotel, Compass, Search, Loader2, Shield, CheckCircle2, AlertCircle } from "lucide-react";

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

type Feedback =
  | { type: "success"; message: string; bookingId?: string }
  | { type: "error"; message: string; fieldErrors?: Record<string, string> }
  | null;

const EMPTY_SEARCH: SearchParamsType = {
  experiences: { destination: "", category: "All", dates: "", travelers: "2" },
  stays: { destination: "", checkIn: "", checkOut: "", guests: "2", rooms: "1", category: "All" },
  flights: { origin: "", destination: "", departureDate: "", returnDate: "", passengers: "1", cabinClass: "Economy", directOnly: false },
};

export function BookingForm() {
  const [activeTab, setActiveTab] = useState("experiences");
  const [searchParams, setSearchParams] = useState<SearchParamsType>(EMPTY_SEARCH);
  const [contact, setContact] = useState<ContactFields>({ fullName: "", email: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

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

  return (
    <Card className="glass-card max-w-5xl mx-auto">
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

            <Button type="submit" className="btn-primary w-full sm:w-auto px-10 py-4 text-lg" disabled={isSubmitting}>
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
