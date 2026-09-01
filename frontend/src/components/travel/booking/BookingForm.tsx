"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Plane, Hotel, Compass, Users, Search, Loader2, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";

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

export function BookingForm() {
  const [activeTab, setActiveTab] = useState("experiences");
  const [searchParams, setSearchParams] = useState<SearchParamsType>({
    experiences: { destination: "", category: "All", dates: "", travelers: "2" },
    stays: { destination: "", checkIn: "", checkOut: "", guests: "2", rooms: "1", category: "All" },
    flights: { origin: "", destination: "", departureDate: "", returnDate: "", passengers: "1", cabinClass: "Economy", directOnly: false },
  });
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSearching(false);
  };

  const updateSearchParam = (tab: keyof SearchParamsType, field: string, value: string | number | boolean) => {
    setSearchParams((prev) => {
      const newTabData: Record<string, unknown> = { ...prev[tab], [field]: value };
      return {
        ...prev,
        [tab]: newTabData as SearchParamsType[typeof tab],
      };
    });
  };

  return (
    <Card className="glass-card max-w-5xl mx-auto">
      <CardHeader className="pb-4">
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
        <form onSubmit={handleSearch} className="space-y-6">
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
                  placeholder="e.g., June 2025, Flexible dates"
                  value={searchParams.experiences.dates}
                  onChange={(e) => updateSearchParam("experiences", "dates", e.target.value)}
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

          <Button type="submit" className="w-full sm:w-auto px-10 py-4 text-lg" disabled={isSearching}>
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" aria-hidden="true" />
                Search
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
