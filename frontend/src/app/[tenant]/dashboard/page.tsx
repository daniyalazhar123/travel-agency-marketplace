import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantConfig } from "@/lib/tenant/config";
import { Footer } from "@/components/travel/footer/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/ui/AuthGuard";
import { Plus, Users, MapPin, BarChart3, Calendar, ArrowRight } from "lucide-react";

interface TenantPageProps {
  params: Promise<{ tenant: string }>;
}

// Quick actions: only routes that EXIST. Disabled entries render as
// non-clickable "coming soon" rows instead of dead 404 links.
const quickActions = [
  { label: "New Booking Request", icon: Plus, href: "/booking", description: "Create a new booking request", enabled: true },
  { label: "Manage Destinations", icon: MapPin, href: "/admin/destinations", description: "Add or remove destinations on your site", enabled: true },
  { label: "Add Client", icon: Users, href: null, description: "Client CRM — coming soon", enabled: false },
  { label: "View Reports", icon: BarChart3, href: null, description: "Analytics — coming soon", enabled: false },
];

const recentActivity = [
  { id: 1, type: "system", description: "Platform connected to Neon database", time: "Recently", status: "completed" },
  { id: 2, type: "config", description: "Tenant configuration loaded", time: "Recently", status: "completed" },
  { id: 3, type: "bookings", description: "Booking intake now live via /api/booking", time: "Recently", status: "completed" },
];

export async function generateMetadata({ params }: TenantPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const tenant = getTenantConfig(resolvedParams.tenant);

  if (!tenant) {
    return { title: "Tenant Not Found" };
  }

  return {
    title: `Dashboard - ${tenant.name}`,
    description: "Agency dashboard overview",
  };
}

export default async function TenantDashboardPage({ params }: TenantPageProps) {
  const resolvedParams = await params;
  const tenant = getTenantConfig(resolvedParams.tenant);

  if (!tenant) {
    return null;
  }

  // Real values from tenant config instead of hardcoded numbers
  const stats = [
    { label: "Total Bookings", value: "0", change: null, description: "Connect your booking feed to see live data", icon: Calendar },
    { label: "Revenue", value: "$0", change: null, description: "Connect payment processing to see revenue", icon: BarChart3 },
    { label: "Active Clients", value: "0", change: null, description: "No client accounts yet", icon: Users },
    {
      label: "Destinations",
      value: String(tenant.destinations?.length ?? 0),
      change: null,
      description: "Curated destinations live on your site",
      icon: MapPin,
    },
  ];

  return (
    <AuthGuard redirectTo={`/${resolvedParams.tenant}/dashboard`}>
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <div className="container-page">
          <div className="mb-10 lg:mb-12">
            <h1 className="heading-section text-foreground mb-2">Dashboard</h1>
            <p className="body-lg">Welcome back. Here's an overview of your agency.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10 lg:mb-12">
            {stats.map((stat) => (
              <Card key={stat.label} className="glass-card transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                    <stat.icon className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-medium text-foreground">{stat.value}</div>
                  {stat.change && (
                    <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-foreground">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activity.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                ))}
                <div className="pt-4">
                  <Button variant="ghost" className="w-full justify-center">
                    View All Activity
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action) =>
                  action.enabled && action.href ? (
                    <Link
                      key={action.label}
                      href={`/${resolvedParams.tenant}${action.href}`}
                      className="flex items-center gap-3 p-3 rounded-lg text-foreground/80 hover:text-foreground hover:bg-muted transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                        <action.icon className="w-5 h-5 text-foreground group-hover:text-accent transition-colors" aria-hidden="true" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">{action.label}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" aria-hidden="true" />
                    </Link>
                  ) : (
                    <div
                      key={action.label}
                      className="flex items-center gap-3 p-3 rounded-lg text-muted-foreground/70 cursor-not-allowed"
                      aria-disabled="true"
                      title="Coming soon"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center">
                        <action.icon className="w-5 h-5 text-muted-foreground/60" aria-hidden="true" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm text-muted-foreground/80">{action.label}</p>
                        <p className="text-xs text-muted-foreground/60">{action.description}</p>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-muted text-muted-foreground" aria-label="Coming soon">
                        Soon
                      </span>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer tenant={tenant} currentTenantSlug={resolvedParams.tenant} />
      </main>
    </div>
    </AuthGuard>
  );
}