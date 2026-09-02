import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenantConfig } from "@/lib/tenant/config";
import { Footer } from "@/components/travel/footer/Footer";
import { FileText } from "lucide-react";

interface TenantPageProps {
  params: Promise<{ tenant: string }>;
}

export async function generateMetadata({ params }: TenantPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const tenant = getTenantConfig(resolvedParams.tenant);
  if (!tenant) return { title: "Tenant Not Found" };
  return {
    title: `Terms of Service - ${tenant.name}`,
    description: `The terms governing your use of ${tenant.name} services.`,
  };
}

const LAST_UPDATED = "September 1, 2026";

interface LegalSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

const sections: LegalSection[] = [
  {
    title: "1. Agreement to Terms",
    paragraphs: [
      "By accessing this website or submitting a booking request, you agree to these Terms of Service. This is placeholder text for demonstration purposes — replace it with your agency's final terms, reviewed by legal counsel, before going live.",
      "If you do not agree with any part of these terms, please do not use our services.",
    ],
  },
  {
    title: "2. Our Services",
    paragraphs: [
      "We operate a travel planning and booking facilitation service. Submitting a booking request on this website constitutes an inquiry — not a confirmed reservation. A booking exists only after we send you a written confirmation and, where applicable, receive payment.",
    ],
  },
  {
    title: "3. User Responsibilities",
    paragraphs: ['You agree to:'],
    bullets: [
      "Provide accurate and complete information for all bookings and inquiries.",
      "Maintain the confidentiality of your account credentials.",
      "Use only a strong, unique password for your account.",
      "Not attempt to probe, scan, or attack the platform or its infrastructure.",
      "Not use automated tools to submit forms, scrape content, or overload services.",
      "Not use our services for any unlawful purpose.",
    ],
  },
  {
    title: "4. Bookings, Pricing & Payment",
    paragraphs: [
      "Prices displayed on this website are indicative and subject to availability, currency fluctuation, and partner pricing changes. Final pricing is confirmed in writing before any payment is requested. We reserve the right to correct obvious pricing errors.",
      "Payment terms, schedules, and accepted methods are specified in your booking confirmation.",
    ],
  },
  {
    title: "5. Cancellations & Refunds",
    paragraphs: [
      "Cancellation rights depend on the specific travel product, supplier terms, and any mandatory protections applicable in your jurisdiction. The following is our general framework:",
    ],
    bullets: [
      "Pre-confirmation inquiries may be withdrawn at any time with no obligation.",
      "Confirmed bookings: cancellation terms are stated in your booking confirmation.",
      "Refunds, where due, are processed to the original payment method.",
      "Force majeure events are handled per supplier terms and applicable law.",
      "Nothing in these terms limits statutory cancellation rights you may have (e.g., EU Package Travel Directive protections).",
    ],
  },
  {
    title: "6. Liability Limitations",
    paragraphs: [
      "To the maximum extent permitted by law:",
    ],
    bullets: [
      "We act as a facilitator between you and travel suppliers (airlines, hotels, experience operators). Supplier performance is their responsibility.",
      "Our liability for direct damages is limited to the amounts you actually paid us for the affected booking.",
      "We are not liable for indirect, incidental, or consequential damages.",
      "We do not exclude liability for death, personal injury, fraud, or any liability that cannot lawfully be excluded.",
    ],
  },
  {
    title: "7. Intellectual Property",
    paragraphs: [
      "All website content — text, imagery, design, and branding — belongs to us or our licensors. You may not reproduce or commercially exploit it without written permission.",
    ],
  },
  {
    title: "8. Third-Party Links",
    paragraphs: [
      "We may link to third-party sites for your convenience. We are not responsible for their content or practices.",
    ],
  },
  {
    title: "9. Termination",
    paragraphs: [
      "We may suspend or terminate access to our services for violation of these terms, with notice where practicable.",
    ],
  },
  {
    title: "10. Governing Law",
    paragraphs: [
      "These terms are governed by the laws of the operator's principal place of business, without regard to conflict-of-law rules. Replace this section with your actual jurisdiction and venue before going live.",
    ],
  },
  {
    title: "11. Changes to These Terms",
    paragraphs: [
      "We may update these terms from time to time. The current version is always available on this page with its effective date.",
    ],
  },
  {
    title: "12. Contact",
    paragraphs: [
      "Questions about these terms? Contact us — we respond to all legitimate inquiries.",
    ],
  },
];

export default async function TermsPage({ params }: TenantPageProps) {
  const resolvedParams = await params;
  const tenant = getTenantConfig(resolvedParams.tenant);
  if (!tenant) notFound();

  const contactEmail = tenant.contact?.email ?? "legal@travel-agency.example.com";

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <div className="container-page max-w-3xl">
          <div className="mb-12 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
              <FileText className="h-7 w-7 text-accent" aria-hidden="true" />
            </div>
            <span className="label text-accent mb-4 inline-block">Legal</span>
            <h1 className="heading-section text-foreground mb-4">Terms of Service</h1>
            <p className="body-lg text-muted-foreground">Last updated: {LAST_UPDATED}</p>
          </div>

          <div className="space-y-6">
            {sections.map((section) => (
              <section key={section.title} className="glass-card p-6 sm:p-8">
                <h2 className="heading-card text-foreground mb-4">{section.title}</h2>
                {section.paragraphs.map((p, i) => (
                  <p key={i} className="body-base text-muted-foreground mb-4 last:mb-0 leading-relaxed">
                    {p}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="space-y-3" role="list">
                    {section.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-3 text-foreground/80">
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                        <span className="leading-relaxed">{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {section.title === "12. Contact" && (
                  <p className="body-base">
                    <a href={`mailto:${contactEmail}`} className="text-accent hover:underline font-medium">
                      {contactEmail}
                    </a>
                  </p>
                )}
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer tenant={tenant} currentTenantSlug={resolvedParams.tenant} />
    </div>
  );
}
