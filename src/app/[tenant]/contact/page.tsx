import { Metadata } from "next";
import { getTenantConfig } from "@/lib/tenant/config";
import { Footer } from "@/components/travel/footer/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MapPin, Phone, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface TenantPageProps {
  params: Promise<{ tenant: string }>;
}

export async function generateMetadata({ params }: TenantPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const tenant = getTenantConfig(resolvedParams.tenant);

  if (!tenant) {
    return { title: "Tenant Not Found" };
  }

  return {
    title: `Contact - ${tenant.name}`,
    description: `Get in touch with ${tenant.name} for your luxury travel planning needs.`,
  };
}

export default async function TenantContactPage({ params }: TenantPageProps) {
  const resolvedParams = await params;
  const tenant = getTenantConfig(resolvedParams.tenant);

  if (!tenant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <div className="container-page">
          <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
            <span className="label text-accent mb-4 inline-block">Contact Us</span>
            <h1 className="heading-section text-foreground mb-4">Start Your Journey</h1>
            <p className="body-lg text-balance">
              Our travel designers are ready to craft your perfect journey. 
              Tell us about your dream destination and let us handle the details.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Get In Touch</CardTitle>
                  <CardDescription>
                    We&apos;d love to hear from you. Reach out and we&apos;ll respond within 24 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {tenant.contact?.email && (
                    <a
                      href={`mailto:${tenant.contact.email}`}
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-on-accent transition-colors">
                        <Mail className="w-6 h-6" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="label text-accent">Email</p>
                        <p className="text-foreground">{tenant.contact.email}</p>
                      </div>
                    </a>
                  )}

                  {tenant.contact?.phone && (
                    <a
                      href={`tel:${tenant.contact.phone}`}
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-on-accent transition-colors">
                        <Phone className="w-6 h-6" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="label text-accent">Phone</p>
                        <p className="text-foreground">{tenant.contact.phone}</p>
                      </div>
                    </a>
                  )}

                  {tenant.contact?.address && (
                    <address className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 not-italic">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                        <MapPin className="w-6 h-6" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="label text-accent">Address</p>
                        <p className="text-foreground">{tenant.contact.address}</p>
                      </div>
                    </address>
                  )}

                  {tenant.contact?.hours && (
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                        <Send className="w-6 h-6" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="label text-accent">Business Hours</p>
                        <p className="text-foreground">{tenant.contact.hours}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Follow Your Journey</CardTitle>
                  <CardDescription>
                    Stay inspired with our latest journeys and travel insights.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {tenant.socialLinks?.map((social) => (
                      <a
                        key={social.platform}
                        href={social.url}
                        className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground/60 hover:text-accent hover:bg-accent/10 transition-colors"
                        aria-label={social.label || social.platform}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Mail className="w-5 h-5" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Send Us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and our team will get back to you within 24 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form id="contact-form" className="space-y-6" >
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input id="firstName" name="firstName" required placeholder="John" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input id="lastName" name="lastName" required placeholder="Doe" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input id="email" name="email" type="email" required placeholder="john.doe@example.com" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Select name="subject" id="subject" required>
                        <SelectTrigger>
                          <SelectValue placeholder="How can we help you?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="booking">New Booking Request</SelectItem>
                          <SelectItem value="modify">Modify Existing Booking</SelectItem>
                          <SelectItem value="group">Group Travel</SelectItem>
                          <SelectItem value="corporate">Corporate Travel</SelectItem>
                          <SelectItem value="press">Press & Media</SelectItem>
                          <SelectItem value="careers">Careers</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="destination">Preferred Destination</Label>
                      <Input id="destination" name="destination" placeholder="e.g., Amalfi Coast, Kyoto, Maldives" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="travelDates">Travel Dates</Label>
                      <Input id="travelDates" name="travelDates" type="text" placeholder="e.g., June 2025, Flexible" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="travelers">Number of Travelers</Label>
                      <Select name="travelers" id="travelers">
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of travelers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Traveler</SelectItem>
                          <SelectItem value="2">2 Travelers</SelectItem>
                          <SelectItem value="3">3 Travelers</SelectItem>
                          <SelectItem value="4">4 Travelers</SelectItem>
                          <SelectItem value="5">5 Travelers</SelectItem>
                          <SelectItem value="6">6 Travelers</SelectItem>
                          <SelectItem value="7+">7+ Travelers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="budget">Budget Range (per person)</Label>
                      <Select name="budget" id="budget">
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under-5k">Under $5,000</SelectItem>
                          <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                          <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                          <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                          <SelectItem value="50k+">$50,000+</SelectItem>
                          <SelectItem value="flexible">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        placeholder="Tell us about your dream journey, special occasions, preferences, or any specific requirements..."
                      />
                    </div>

                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="newsletter"
                        name="newsletter"
                        className="mt-1 w-4 h-4 rounded border-border text-accent focus:ring-accent"
                      />
                      <Label htmlFor="newsletter" className="text-sm font-normal cursor-pointer">
                        Subscribe to our newsletter for travel inspiration, exclusive offers, and destination guides.
                      </Label>
                    </div>

                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="privacy"
                        name="privacy"
                        required
                        className="mt-1 w-4 h-4 rounded border-border text-accent focus:ring-accent"
                      />
                      <Label htmlFor="privacy" className="text-sm font-normal cursor-pointer">
                        I agree to the <a href={`/${resolvedParams.tenant}/privacy`} className="text-accent hover:underline">Privacy Policy</a> and consent to being contacted about my inquiry.
                      </Label>
                    </div>

                    <Button type="submit" className="w-full sm:w-auto px-10 py-4 text-lg" disabled={false}>
                      <Send className="w-5 h-5 mr-2" aria-hidden="true" />
                      Send Message
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      By submitting this form, you agree to our Privacy Policy. We&apos;ll never share your information.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer tenant={tenant} currentTenantSlug={resolvedParams.tenant} />
    </div>
  );
}