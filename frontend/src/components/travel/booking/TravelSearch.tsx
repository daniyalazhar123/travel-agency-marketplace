"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plane, MapPin, Hotel, Compass, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SearchTab = "flights" | "stays" | "experiences";

interface TravelSearchProps {
  defaultTab?: SearchTab;
  onSearch?: (tab: SearchTab, data: SearchFormData) => void;
}

interface SearchFormData {
  destination: string;
  checkIn: string;
  checkOut: string;
  travelers: number;
  class?: string;
}

interface FieldConfig {
  name: keyof SearchFormData;
  label: string;
  placeholder?: string;
  icon?: React.ReactNode;
  type?: "text" | "select" | "date";
  options?: (string | number)[];
}

const tabs: { id: SearchTab; label: string; icon: React.ReactNode }[] = [
  { id: "flights", label: "Flights", icon: <Plane className="w-5 h-5" aria-hidden="true" /> },
  { id: "stays", label: "Stays", icon: <Hotel className="w-5 h-5" aria-hidden="true" /> },
  { id: "experiences", label: "Experiences", icon: <Compass className="w-5 h-5" aria-hidden="true" /> },
];

const easing = [0.4, 0, 0.2, 1] as const;

const tabVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: easing } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2, ease: easing } },
};

const indicatorVariants = {
  animate: (x: number) => ({
    x,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  }),
};

export function TravelSearch({ defaultTab = "experiences", onSearch }: TravelSearchProps) {
  const [activeTab, setActiveTab] = useState<SearchTab>(defaultTab);
  const [formData, setFormData] = useState<SearchFormData>({
    destination: "",
    checkIn: "",
    checkOut: "",
    travelers: 2,
    class: "economy",
  });
  const [indicatorPosition, setIndicatorPosition] = useState(0);

  const updateField = useCallback(<K extends keyof SearchFormData>(field: K, value: SearchFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(activeTab, formData);
  };

  const handleTabChange = (tab: SearchTab, index: number) => {
    setActiveTab(tab);
    const tabWidth = 100 / tabs.length;
    setIndicatorPosition(index * tabWidth);
  };

  const tabConfig: Record<SearchTab, { fields: FieldConfig[] }> = {
    flights: {
      fields: [
        { name: "destination", label: "From", placeholder: "Departure city", icon: <MapPin className="w-5 h-5" aria-hidden="true" />, type: "text" },
        { name: "destination", label: "To", placeholder: "Destination", icon: <MapPin className="w-5 h-5" aria-hidden="true" />, type: "text" },
        { name: "checkIn", label: "Departure", placeholder: "Select date", icon: <Calendar className="w-5 h-5" aria-hidden="true" />, type: "date" },
        { name: "travelers", label: "Passengers", type: "select", options: [1, 2, 3, 4, 5, 6, 7, 8] },
        { name: "class", label: "Class", type: "select", options: ["Economy", "Premium Economy", "Business", "First"] },
      ],
    },
    stays: {
      fields: [
        { name: "destination", label: "Destination", placeholder: "Where to?", icon: <MapPin className="w-5 h-5" aria-hidden="true" />, type: "text" },
        { name: "checkIn", label: "Check-in", placeholder: "Select date", icon: <Calendar className="w-5 h-5" aria-hidden="true" />, type: "date" },
        { name: "checkOut", label: "Check-out", placeholder: "Select date", icon: <Calendar className="w-5 h-5" aria-hidden="true" />, type: "date" },
        { name: "travelers", label: "Guests", type: "select", options: [1, 2, 3, 4, 5, 6, 7, 8] },
      ],
    },
    experiences: {
      fields: [
        { name: "destination", label: "Destination", placeholder: "Where to?", icon: <MapPin className="w-5 h-5" aria-hidden="true" />, type: "text" },
        { name: "checkIn", label: "Date", placeholder: "Select date", icon: <Calendar className="w-5 h-5" aria-hidden="true" />, type: "date" },
        { name: "travelers", label: "Participants", type: "select", options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
      ],
    },
  };

  const currentConfig = tabConfig[activeTab];

  return (
    <section className="relative -mt-16 mb-20 lg:mb-28 z-20" aria-labelledby="search-heading">
      <div className="container-page">
        <motion.div
          className="glass-card p-6 lg:p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easing }}
        >
          <div className="mb-6">
            <h2 id="search-heading" className="heading-card text-foreground mb-2">
              Plan Your Journey
            </h2>
            <p className="body-base">
              Search and book flights, luxury stays, and curated experiences in one place.
            </p>
          </div>

          <div className="relative mb-6" role="tablist" aria-label="Search type">
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-accent rounded-full"
              style={{ width: `${100 / tabs.length}%` }}
              variants={indicatorVariants}
              animate={indicatorVariants.animate(indicatorPosition)}
            />
            <div className="flex bg-muted rounded-lg p-1" role="presentation">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`${tab.id}-panel`}
                  id={`${tab.id}-tab`}
                  onClick={() => handleTabChange(tab.id, index)}
                  className={`relative flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 flex-1 ${
                    activeTab === tab.id
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={activeTab}
              onSubmit={handleSubmit}
              id={`${activeTab}-panel`}
              role="tabpanel"
              aria-labelledby={`${activeTab}-tab`}
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end"
            >
              {currentConfig.fields.map((field, index) => (
                <motion.div
                  key={`${activeTab}-${field.name}-${index}`}
                  className={field.name === "destination" && field.label === "To" ? "lg:col-span-1" : "lg:col-span-1"}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <label htmlFor={`${activeTab}-${field.name}`} className="label mb-1.5 block">
                    {field.label}
                  </label>
                  {field.type === "select" ? (
                    <Select
                      value={formData[field.name] as string}
                      onValueChange={(value) => updateField(field.name, value as SearchFormData[typeof field.name])}
                    >
                      <SelectTrigger id={`${activeTab}-${field.name}`} className="h-12">
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {(field.options as (string | number)[]).map((option) => (
                          <SelectItem key={String(option)} value={String(option)}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="relative">
                      {field.icon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true">
                          {field.icon}
                        </div>
                      )}
                      <Input
                        id={`${activeTab}-${field.name}`}
                        type={field.type === "date" ? "date" : "text"}
                        placeholder={field.placeholder}
                        value={formData[field.name] as string}
                        onChange={(e) => updateField(field.name, e.target.value)}
                        className={field.icon ? "pl-12" : ""}
                      />
                    </div>
                  )}
                </motion.div>
              ))}

              <motion.div className="lg:col-span-1" style={{ transitionDelay: `${currentConfig.fields.length * 50}ms` }}>
                <Button type="submit" className="btn-accent w-full h-12 lg:h-14 text-lg group">
                  <Search className="w-5 h-5 mr-2" aria-hidden="true" />
                  Search
                </Button>
              </motion.div>
            </motion.form>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
