import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenantConfig } from "@/lib/tenant/config";
import { Footer } from "@/components/travel/footer/Footer";
import { ShieldCheck } from "lucide-react";

interface TenantPageProps {
  params: Promise<{ tenant: string }>;
}

export async function generateMetadata({ params }: TenantPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const tenant = getTenantConfig(resolvedParams.tenant);
  if (!tenant) return { title: "Tenant Not Found" };
  return {
    title: `Privacy Policy - ${tenant.name}`,
    description: `How ${tenant.name} collects, uses, and protects your personal data.`,
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
    title: "1. Who We Are",
    paragraphs: [
      'This Privacy Policy explains how we collect, use, and protect your personal information when you use our website and travel services. This is placeholder text for demonstration purposes — replace it with your agency\'s final policy and legal entity details before going live.',
    ],
  },
  {
    title: "2. Information We Collect",
    paragraphs: ['We collect only the information needed to operate our services:'],
    bullets: [
      "Account data: your name, email address, and a cryptographically hashed password (we never store plain-text passwords).",
      "Booking inquiries: your name, email, phone (optional), destination, travel dates, number of travelers, and any notes you share.",
      "Newsletter subscriptions: your email address.",
      "Technical data: your IP address (used solely for rate limiting and abuse prevention) and your cookie-consent preference.",
    ],
  },
  {
    title: "3. How We Use Your Information",
    paragraphs: ['We process your data to deliver the services you request:'],
    bullets: [
      "Processing and responding to booking requests and travel inquiries.",
      "Verifying your email address during account registration.",
      "Sending newsletter emails you subscribed to (every email includes an unsubscribe option).",
      "Responding to customer support requests.",
      "Protecting the platform against abuse, spam, and automated attacks.",
    ],
  },
  {
    title: "4. Legal Bases for Processing (GDPR)",
    paragraphs: [
      'If you are in the European Economic Area, we rely on the following legal bases:',
    ],
    bullets: [
      "Performance of a contract — processing booking requests you submit.",
      "Legitimate interests — platform security, rate limiting, and service improvement.",
      "Consent — newsletter subscriptions, which you may withdraw at any time.",
    ],
  },
  {
    title: "5. Cookies & Local Storage",
    paragraphs: [
      "We use only essential, privacy-respecting storage. Currently this platform sets no advertising or third-party tracking cookies. Your cookie-consent choice is stored in your browser's localStorage and never leaves your device.",
    ],
  },
  {
    title: "6. Service Providers",
    paragraphs: [
      'We share data only with processors that help us operate, under contracts that restrict their use of your data:',
    ],
    bullets: [
      "Neon (database hosting) — stores your account, booking, and subscription records.",
      "Resend (email delivery) — sends verification and newsletter emails on our behalf.",
    ],
  },
  {
    title: "7. Data Retention",
    paragraphs: ['We keep your data only as long as necessary:'],
    bullets: [
      "Booking records: up to 5 years (accounting and legal obligations).",
      "Newsletter subscriptions: until you unsubscribe.",
      "Authentication and security logs: up to 12 months.",
      "Deletion requests are honored within 30 days.",
    ],
  },
  {
    title: "8. Your Rights",
    paragraphs: ['GDPR (EEA/UK) — you may:'],
    bullets: [
      "Access, correct, or delete your personal data.",
      "Restrict or object to processing.",
      "Request data portability.",
      "Withdraw consent at any time.",
      "Lodge a complaint with your supervisory authority.",
      "CCPA/CPRA (California) — you may request disclosure of collected data, request deletion, correct inaccuracies, and opt out of any sale. We do not sell personal information.",
    ],
  },
  {
    title: "9. Data Security",
    paragraphs: [
      "All traffic is encrypted in transit (TLS). Passwords are hashed with industry-standard key-derivation functions. Database access uses parameterized queries and least-privilege credentials. No method of transmission is 100% secure, but we work hard to protect your data.",
    ],
  },
  {
    title: "10. Children's Privacy",
    paragraphs: [
      "Our services are not directed to children under 16. We do not knowingly collect personal data from children. If you believe a child has provided data, contact us and we will delete it.",
    ],
  },
  {
    title: "11. Changes to This Policy",
    paragraphs: [
      "We may update this policy from time to time. Material changes will be posted on this page with an updated effective date.",
    ],
  },
  {
    title: "12. Contact Us",
    paragraphs: [
      "For any privacy request or question, contact us — we respond to all verified requests.",
    ],
  },
];

export default async function PrivacyPage({ params }: TenantPageProps) {
  const resolvedParams = await params;
  const tenant = getTenantConfig(resolvedParams.tenant);
  if (!tenant) notFound();

  const contactEmail = tenant.contact?.email ?? "privacy@travel-agency.example.com";

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <div className="container-page max-w-3xl">
          <div className="mb-12 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
              <ShieldCheck className="h-7 w-7 text-accent" aria-hidden="true" />
            </div>
            <span className="label text-accent mb-4 inline-block">Legal</span>
            <h1 className="heading-section text-foreground mb-4">Privacy Policy</h1>
            <p className="body-lg text-muted-foreground">Last updated: {LAST_UPDATED}</p>
          </div>

          <div className="space-y-6">
            {sections.map((section) => (
              <section key={section.title} className="glass-card p-6 sm:p-8" aria-labelledby={`privacy-${section.title.charAt(0)}`}>
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
                {section.title === "12. Contact Us" && (
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
