"use client";

/**
 * Contact form — client half of /[tenant]/contact.
 *
 * The original form had no action/onSubmit: a native GET submit
 * reloaded the page with PII in the URL query string. This component
 * prevents default submission and POSTs to /api/contact (lead capture,
 * source=contact_form) with explicit success/error states.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ContactFormClientProps {
  tenantSlug: string;
}

type Feedback =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

const SUBJECT_LABELS: Record<string, string> = {
  general: "General Inquiry",
  booking: "New Booking Request",
  modify: "Modify Existing Booking",
  group: "Group Travel",
  corporate: "Corporate Travel",
  press: "Press & Media",
  careers: "Careers",
  other: "Other",
};
const TRAVELERS = ["1", "2", "3", "4", "5", "6", "7+"];
const BUDGETS = [
  { value: "under-5k", label: "Under $5,000" },
  { value: "5k-10k", label: "$5,000 - $10,000" },
  { value: "10k-25k", label: "$10,000 - $25,000" },
  { value: "25k-50k", label: "$25,000 - $50,000" },
  { value: "5k+", label: "$50,000+" },
  { value: "flexible", label: "Flexible" },
];

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_RE = /^[+0-9()\-\s]*$/;

export function ContactFormClient({ tenantSlug }: ContactFormClientProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "general",
    destination: "",
    travelDates: "",
    travelers: "",
    budget: "",
    message: "",
  });
  const [newsletter, setNewsletter] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (field: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    // CRITICAL: blocks the native GET submit that leaked PII into the URL
    e.preventDefault();
    setFeedback(null);
    setFieldErrors({});

    // Client-side pre-validation (server re-validates authoritatively)
    const errors: Record<string, string> = {};
    if (form.firstName.trim().length < 1) errors.firstName = "First name is required.";
    if (form.lastName.trim().length < 1) errors.lastName = "Last name is required.";
    if (!EMAIL_RE.test(form.email.trim())) errors.email = "A valid email is required.";
    if (form.phone && !PHONE_RE.test(form.phone.trim())) errors.phone = "Invalid phone number.";
    if (form.message.trim().length < 1) errors.message = "Message is required.";
    if (!privacy) errors.privacy = "You must accept the Privacy Policy to submit.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFeedback({ type: "error", message: "Please fix the highlighted fields." });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenantSlug, ...form, newsletter }),
      });
      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; message?: string; error?: string; fieldErrors?: Record<string, string> }
        | null;

      if (res.ok && json?.success) {
        setFeedback({
          type: "success",
          message: json.message ?? "Message sent — a travel designer will reply within 24 hours.",
        });
        setForm({
          firstName: "", lastName: "", email: "", phone: "", subject: "general",
          destination: "", travelDates: "", travelers: "", budget: "", message: "",
        });
        setNewsletter(false);
      } else {
        setFieldErrors(json?.fieldErrors ?? {});
        setFeedback({ type: "error", message: json?.error ?? "We couldn't send your message. Please try again." });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error — please check your connection and try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const err = (key: string) => fieldErrors[key];

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input id="firstName" value={form.firstName} onChange={(e) => set("firstName")(e.target.value)} placeholder="John" maxLength={100} required aria-invalid={!!err("firstName")} />
          {err("firstName") && <p className="text-xs text-error">{err("firstName")}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input id="lastName" value={form.lastName} onChange={(e) => set("lastName")(e.target.value)} placeholder="Doe" maxLength={100} required aria-invalid={!!err("lastName")} />
          {err("lastName") && <p className="text-xs text-error">{err("lastName")}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input id="email" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={(e) => set("email")(e.target.value)} placeholder="john.doe@example.com" maxLength={320} required aria-invalid={!!err("email")} />
        {err("email") && <p className="text-xs text-error">{err("email")}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" type="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="+1 (555) 000-0000" maxLength={32} aria-invalid={!!err("phone")} />
        {err("phone") && <p className="text-xs text-error">{err("phone")}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject *</Label>
        <Select value={form.subject} onValueChange={set("subject")}>
          <SelectTrigger id="subject">
            <SelectValue placeholder="How can we help you?" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SUBJECT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="destination">Preferred Destination</Label>
        <Input id="destination" value={form.destination} onChange={(e) => set("destination")(e.target.value)} placeholder="e.g., Amalfi Coast, Kyoto, Maldives" maxLength={200} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="travelDates">Travel Dates</Label>
        <Input id="travelDates" value={form.travelDates} onChange={(e) => set("travelDates")(e.target.value)} placeholder="e.g., June 2025, Flexible" maxLength={100} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="travelers">Number of Travelers</Label>
          <Select value={form.travelers} onValueChange={set("travelers")}>
            <SelectTrigger id="travelers">
              <SelectValue placeholder="Select number of travelers" />
            </SelectTrigger>
            <SelectContent>
              {TRAVELERS.map((v) => (
                <SelectItem key={v} value={v}>{v === "7+" ? "7+ Travelers" : `${v} Traveler${v === "1" ? "" : "s"}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget">Budget Range (per person)</Label>
          <Select value={form.budget} onValueChange={set("budget")}>
            <SelectTrigger id="budget">
              <SelectValue placeholder="Select budget range" />
            </SelectTrigger>
            <SelectContent>
              {BUDGETS.map((b) => (
                <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message *</Label>
        <Textarea id="message" value={form.message} onChange={(e) => set("message")(e.target.value)} required rows={6} maxLength={5000} placeholder="Tell us about your dream journey, special occasions, preferences, or any specific requirements..." aria-invalid={!!err("message")} />
        {err("message") && <p className="text-xs text-error">{err("message")}</p>}
      </div>

      <div className="flex items-start gap-3">
        <input id="newsletter" type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} className="mt-1 w-4 h-4 rounded border-border text-accent focus:ring-accent" />
        <Label htmlFor="newsletter" className="text-sm font-normal cursor-pointer">
          Subscribe to our newsletter for travel inspiration, exclusive offers, and destination guides.
        </Label>
      </div>

      <div className="flex items-start gap-3">
        <input id="privacy" type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} required className="mt-1 w-4 h-4 rounded border-border text-accent focus:ring-accent" />
        <Label htmlFor="privacy" className="text-sm font-normal cursor-pointer">
          I agree to the <a href={`/${tenantSlug}/privacy`} className="text-accent hover:underline">Privacy Policy</a> and consent to being contacted about my inquiry.
        </Label>
      </div>
      {err("privacy") && <p className="text-xs text-error">{err("privacy")}</p>}

      {feedback?.type === "success" && (
        <p role="status" className="flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {feedback.message}
        </p>
      )}
      {feedback?.type === "error" && (
        <p role="alert" className="flex items-center gap-2 text-sm text-error">
          <AlertCircle className="w-4 h-4 shrink-0" /> {feedback.message}
        </p>
      )}

      <Button type="submit" className="w-full sm:w-auto px-10 py-4 text-lg" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" /> : <Send className="w-5 h-5 mr-2" aria-hidden="true" />}
        {isSubmitting ? "Sending..." : "Send Message"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By submitting this form, you agree to our Privacy Policy. We&apos;ll never share your information.
      </p>
    </form>
  );
}
