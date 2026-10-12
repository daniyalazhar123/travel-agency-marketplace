"use client";

/**
 * Client half of /[tenant]/dashboard.
 *
 * Owns the animated stat cards (motion.div + spring hover). Lucide icon
 * components are imported HERE — function references cannot be passed
 * as props across the server -> client boundary — so the page supplies
 * only the live destination count.
 */

import { motion } from "framer-motion";
import { Users, MapPin, BarChart3, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cardVariants } from "@/lib/motion-primitives";

interface DashboardClientProps {
  destinationCount: number;
}

export function DashboardClient({ destinationCount }: DashboardClientProps) {
  // Real values from tenant config instead of hardcoded numbers
  const stats = [
    { label: "Total Bookings", value: "0", description: "Connect your booking feed to see live data", icon: Calendar },
    { label: "Revenue", value: "$0", description: "Connect payment processing to see revenue", icon: BarChart3 },
    { label: "Active Clients", value: "0", description: "No client accounts yet", icon: Users },
    {
      label: "Destinations",
      value: String(destinationCount),
      description: "Curated destinations live on your site",
      icon: MapPin,
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10 lg:mb-12">
      {stats.map((stat) => (
        <motion.div key={stat.label} variants={cardVariants} whileHover={{ scale: 1.02, boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
          <Card className="glass-card transition-all duration-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-medium text-foreground">{stat.value}</div>
              <p className="text-sm text-muted-foreground mt-2">{stat.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
