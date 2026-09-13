"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, Loader2, AlertCircle, CheckCircle2, Trash2, MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clearSession, getToken } from "@/lib/session";
import { useRouter } from "next/navigation";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://127.0.0.1:8000";

interface DestinationRow {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  image_url: string | null;
  is_active: boolean;
  order: number;
}

type Feedback =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

const EMPTY_FORM = { title: "", price: "", currency: "USD", image_url: "", description: "" };

function AdminDestinationsInner() {
  const params = useParams<{ tenant: string }>();
  const tenant = params.tenant ?? "demo";
  const router = useRouter();

  /** Session died mid-action (401): clear it and bounce to /login?next=this page. */
  const handleSessionExpired = useCallback(() => {
    clearSession();
    router.replace(`/login?next=${encodeURIComponent(`/${tenant}/admin/destinations`)}`);
  }, [router, tenant]);

  const [items, setItems] = useState<DestinationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const authHeaders = useCallback((): Record<string, string> => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/destinations?tenant_id=${encodeURIComponent(tenant)}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Failed to load (HTTP ${res.status})`);
      const json = (await res.json()) as DestinationRow[];
      setItems(json);
    } catch {
      setLoadError("Could not load destinations. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFeedback(null);

    if (form.title.trim().length < 1) {
      setFeedback({ type: "error", message: "Title is required." });
      return;
    }
    const priceNum = form.price.trim() === "" ? null : Number(form.price);
    if (priceNum !== null && (Number.isNaN(priceNum) || priceNum < 0)) {
      setFeedback({ type: "error", message: "Price must be a non-negative number." });
      return;
    }
    if (form.image_url.trim() !== "" && !/^https?:\/\//.test(form.image_url.trim())) {
      setFeedback({ type: "error", message: "Image URL must start with http:// or https://" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/destinations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          tenant_id: tenant,
          title: form.title.trim(),
          description: form.description.trim() || null,
          price: priceNum,
          currency: form.currency || "USD",
          image_url: form.image_url.trim() || null,
        }),
      });
      const json = (await res.json().catch(() => null)) as { detail?: string | { detail?: string } } | null;
      if (res.ok) {
        setFeedback({ type: "success", message: "Destination added." });
        setForm(EMPTY_FORM);
        await load();
      } else if (res.status === 401) {
        setFeedback({ type: "error", message: "Your session expired — redirecting to sign in..." });
        handleSessionExpired();
      } else {
        const detail = json?.detail;
        const msg = typeof detail === "string" ? detail : (detail as { detail?: string })?.detail;
        setFeedback({ type: "error", message: msg ?? "Could not add destination." });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error — please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    setFeedback(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/destinations/${id}?tenant_id=${encodeURIComponent(tenant)}`,
        { method: "DELETE", headers: authHeaders() }
      );
      if (res.ok) {
        setFeedback({ type: "success", message: "Destination deleted." });
        await load();
      } else if (res.status === 401) {
        setFeedback({ type: "error", message: "Your session expired — redirecting to sign in..." });
        handleSessionExpired();
      } else {
        setFeedback({ type: "error", message: "Could not delete destination." });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error — please try again." });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container-page pb-16">
      <div className="mb-10 flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link
            href={`/${tenant}/dashboard`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Dashboard
          </Link>
          <h1 className="heading-section text-foreground mb-2">Manage Destinations</h1>
          <p className="body-base text-muted-foreground">
            Add and remove destinations shown on your public site.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" aria-hidden="true" />
          {loading ? "Loading..." : `${items.length} destination${items.length === 1 ? "" : "s"}`}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Add form */}
        <Card className="glass-card lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="heading-card flex items-center gap-2">
              <Plus className="w-5 h-5 text-accent" aria-hidden="true" />
              Add New Destination
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="dest-title">Title *</Label>
                <Input
                  id="dest-title"
                  placeholder="e.g., Santorini"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  maxLength={200}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="dest-price">Price</Label>
                  <Input
                    id="dest-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="3800"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dest-currency">Currency</Label>
                  <select
                    id="dest-currency"
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    disabled={isSubmitting}
                  >
                    {["USD", "EUR", "GBP", "INR", "AED"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dest-image">Image URL</Label>
                <Input
                  id="dest-image"
                  type="url"
                  placeholder="https://..."
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  maxLength={1000}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dest-desc">Description</Label>
                <Textarea
                  id="dest-desc"
                  placeholder="A short, evocative description..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  maxLength={5000}
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Add Destination
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <div className="lg:col-span-2 space-y-4">
          {feedback?.type === "success" && (
            <p role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {feedback.message}
            </p>
          )}
          {feedback?.type === "error" && (
            <p role="alert" className="flex items-center gap-2 text-sm text-error">
              <AlertCircle className="h-4 w-4" aria-hidden="true" /> {feedback.message}
            </p>
          )}

          {loading ? (
            <div className="glass-card p-10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
            </div>
          ) : loadError ? (
            <Card className="glass-card">
              <CardContent className="p-8 text-center space-y-4">
                <AlertCircle className="mx-auto h-8 w-8 text-error" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">{loadError}</p>
                <Button onClick={load} variant="outline">Retry</Button>
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-10 text-center">
                <MapPin className="mx-auto h-8 w-8 text-muted-foreground/50 mb-4" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  No destinations yet. Add your first one with the form.
                </p>
              </CardContent>
            </Card>
          ) : (
            items.map((dest) => (
              <Card key={dest.id} className="glass-card">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{dest.title}</p>
                    {dest.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{dest.description}</p>
                    )}
                    <p className="text-sm text-accent font-medium mt-2">
                      {dest.price != null
                        ? `${dest.currency} ${dest.price.toLocaleString()}`
                        : "Contact for pricing"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(dest.id)}
                    disabled={deletingId === dest.id}
                    className="text-error hover:text-error hover:bg-error-light shrink-0"
                    aria-label={`Delete ${dest.title}`}
                  >
                    {deletingId === dest.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline ml-1.5">Delete</span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDestinationsPage() {
  return <AdminDestinationsInner />;
}
