import { Metadata } from "next";
import Link from "next/link";
import { getTenantConfig } from "@/lib/tenant/config";
import { Footer } from "@/components/travel/footer/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, MapPin, BarChart3, Calendar, ArrowRight } from "lucide-react";

interface TenantPageProps {
  params: Promise<{ tenant: string }>;
}

const stats = [
  { label: "Total Bookings", value: "0", change: null, description: "No bookings this period", icon: Calendar },
  { label: "Revenue", value: "$0", change: null, description: "No revenue this period", icon: BarChart3 },
  { label: "Active Clients", value: "0", change: null, description: "No active clients", icon: Users },
  { label: "Destinations", value: "6", change: "+2 this month", description: "Curated destinations", icon: MapPin },
];

const quickActions = [
  { label: "New Booking", icon: Plus, href: "/booking/new", description: "Create a new booking" },
  { label: "Add Client", icon: Users, href: "/clients/new", description: "Add a new client" },
  { label: "Manage Destinations", icon: MapPin, href: "/destinations/manage", description: "Edit destinations" },
  { label: "View Reports", icon: BarChart3, href: "/reports", description: "Business analytics" },
];

const recentActivity = [
  { id: 1, type: "system", description: "System initialized", time: "Just now", status: "completed" },
  { id: 2, type: "config", description: "Tenant configuration loaded", time: "1 minute ago", status: "completed" },
  { id: 3, type: "sync", description: "Destination data synchronized", time: "5 minutes ago", status: "completed" },
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

  return (
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
                {quickActions.map((action) => (
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
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer tenant={tenant} currentTenantSlug={resolvedParams.tenant} />
      </main>
    </div>
  );
}