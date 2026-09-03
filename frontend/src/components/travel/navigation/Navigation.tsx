"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, ArrowRight, LogOut } from "lucide-react";
import { type TenantConfig } from "@/lib/tenant/config";
import { clearSession, getSessionUser, type SessionUser } from "@/lib/session";

interface NavigationProps {
  tenant: TenantConfig;
  currentTenantSlug: string;
}

const easing = [0.4, 0, 0.2, 1] as const;

const navigationVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easing } },
  scrolled: { backgroundColor: "rgba(250, 250, 249, 0.95)", backdropFilter: "blur(20px)", boxShadow: "0 4px 30px rgba(0, 0, 0, 0.08)" },
  initial: { backgroundColor: "transparent", backdropFilter: "none", boxShadow: "none" },
};

const linkVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 * i, duration: 0.3, ease: easing },
  }),
};

const mobileMenuVariants = {
  hidden: { opacity: 0, height: 0, overflow: "hidden" },
  visible: { opacity: 1, height: "auto", transition: { duration: 0.3, ease: easing } },
};

const dropdownVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: easing } },
  exit: { opacity: 0, y: 4, scale: 0.98, transition: { duration: 0.15, ease: easing } },
};

// Category links route to the real /destinations page (filtered client-side).
// No category-specific routes exist yet — the label conveys intent for a future
// release; the href never 404s.
const destinationCategories = [
  { label: "Europe", href: "/destinations?category=Europe", badge: null },
  { label: "Asia Pacific", href: "/destinations?category=Asia%20Pacific", badge: null },
  { label: "Americas", href: "/destinations?category=Americas", badge: null },
  { label: "Africa & Middle East", href: "/destinations?category=Africa", badge: null },
  { label: "Private Islands", href: "/destinations?category=Island%20Escape", badge: "Soon" },
];

export function Navigation({ tenant, currentTenantSlug }: NavigationProps) {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDestDropdownOpen, setIsDestDropdownOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const mobileMenuToggleRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    setSessionUser(getSessionUser());
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    clearSession();
    setSessionUser(null);
    setIsMobileMenuOpen(false);
    router.push("/login");
  };

  const navItems = tenant.navigation?.items ?? [
    { label: "Explore", href: `/${currentTenantSlug}/explore` },
    { label: "Destinations", href: `/${currentTenantSlug}/destinations` },
    { label: "Experiences", href: `/${currentTenantSlug}/experiences` },
    { label: "About", href: `/${currentTenantSlug}/about` },
  ];

  const navCTA = tenant.navigation?.cta ?? {
    label: "Plan Your Trip",
    href: `/${currentTenantSlug}/booking`,
    variant: "primary" as const,
  };

  const buildHref = (href: string) => {
    if (!href) return `/${currentTenantSlug}`;
    if (href.startsWith("/")) {
      return `/${currentTenantSlug}${href}`;
    }
    return `/${currentTenantSlug}/${href}`;
  };

  const handleDropdownEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setIsDestDropdownOpen(true);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setIsDestDropdownOpen(false);
    }, 150);
  };

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  const getCTAClassName = (variant: string) => {
    switch (variant) {
      case "primary": return "btn-primary";
      case "secondary": return "btn-secondary";
      case "accent": return "btn-accent";
      case "ghost": return "btn-ghost";
      default: return "btn-primary";
    }
  };

  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" style={{ backgroundColor: "transparent" }}>
        <div className="container-page flex items-center justify-between h-20 lg:h-24">
          <div className="text-display text-2xl font-medium tracking-tight" style={{ color: tenant.primaryColor }}>
            {tenant.name}
          </div>
        </div>
      </header>
    );
  }

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50"
      initial="initial"
      animate={isScrolled ? "scrolled" : "initial"}
      variants={navigationVariants}
      transition={{ duration: 0.3, ease: easing }}
      style={{ backgroundColor: isScrolled ? "rgba(250, 250, 249, 0.95)" : "transparent" }}
    >
      <nav className="container-page flex items-center justify-between h-20 lg:h-24" aria-label="Main navigation">
        <Link href={buildHref("")} className="text-display text-2xl font-medium tracking-tight link-underline" style={{ color: tenant.primaryColor }} aria-label={`${tenant.name} - Home`}>
          {tenant.name}
        </Link>

        <div className="hidden lg:flex items-center gap-10">
          <motion.ul className="flex items-center gap-8" variants={navigationVariants} initial="hidden" animate="visible">
            {navItems.map((item) => {
              const isDestinations = item.label === "Destinations";

              if (isDestinations) {
                return (
                  <motion.li key={item.href} variants={linkVariants} className="relative">
                    <div
                      ref={dropdownRef}
                      onMouseEnter={handleDropdownEnter}
                      onMouseLeave={handleDropdownLeave}
                    >
                      <Link
                        href={buildHref(item.href)}
                        className="flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors duration-200 relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-current after:scale-x-0 after:origin-bottom-right hover:after:scale-x-100 hover:after:origin-bottom-left after:transition-transform after:duration-300"
                        onClick={() => setIsDestDropdownOpen(false)}
                      >
                        {item.label}
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${isDestDropdownOpen ? "rotate-180" : ""}`}
                          aria-hidden="true"
                        />
                      </Link>

                      <AnimatePresence>
                        {isDestDropdownOpen && (
                          <motion.div
                            variants={dropdownVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="absolute top-full left-0 mt-3 w-64 rounded-xl border border-border bg-background shadow-lg overflow-hidden"
                            onMouseEnter={handleDropdownEnter}
                            onMouseLeave={handleDropdownLeave}
                          >
                            <div className="p-2">
                              {destinationCategories.map((cat) => (
                                <Link
                                  key={cat.label}
                                  href={buildHref(cat.href)}
                                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground/80 hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-150"
                                  onClick={() => setIsDestDropdownOpen(false)}
                                >
                                  <span>{cat.label}</span>
                                  {cat.badge && (
                                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent/10 text-accent" aria-label="Coming soon">
                                      {cat.badge}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>

                            <div className="border-t border-border">
                              <Link
                                href={buildHref(item.href)}
                                className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-accent hover:bg-accent/5 transition-colors duration-150"
                                onClick={() => setIsDestDropdownOpen(false)}
                              >
                                <span>Browse All</span>
                                <ArrowRight className="w-4 h-4" aria-hidden="true" />
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.li>
                );
              }

              return (
                <motion.li key={item.href} variants={linkVariants}>
                  <Link href={buildHref(item.href)} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors duration-200 relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-current after:scale-x-0 after:origin-bottom-right hover:after:scale-x-100 hover:after:origin-bottom-left after:transition-transform after:duration-300">
                    {item.label}
                  </Link>
                </motion.li>
              );
            })}
          </motion.ul>

          {navCTA && (
            <motion.div variants={linkVariants}>
              <Link href={buildHref(navCTA.href)} className={`${getCTAClassName(navCTA.variant || "primary")} text-sm px-6 py-2.5`}>
                {navCTA.label}
              </Link>
            </motion.div>
          )}

          {mounted && sessionUser && (
            <motion.div variants={linkVariants} className="hidden lg:flex items-center gap-2">
              <span className="text-xs text-muted-foreground max-w-[140px] truncate" title={sessionUser.email}>
                {sessionUser.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs font-medium text-foreground/70 hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                Sign Out
              </button>
            </motion.div>
          )}
        </div>

        <button
          ref={mobileMenuToggleRef}
          className="lg:hidden p-2 rounded-lg text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            className="lg:hidden border-t border-border bg-background"
            role="menu"
            aria-label="Main navigation"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{ overflow: "hidden" }}
          >
            <div className="container-page py-6 space-y-4">
              <motion.ul className="flex flex-col gap-2" variants={navigationVariants} initial="hidden" animate="visible" role="menu">
                {navItems.map((item) => (
                  <motion.li key={item.href} variants={linkVariants} role="menuitem">
                    <Link href={buildHref(item.href)} className="block px-4 py-3 text-base font-medium text-foreground/80 hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-200" onClick={() => { setIsMobileMenuOpen(false); mobileMenuToggleRef.current?.focus(); }}>
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>

              {navCTA && (
                <motion.div variants={linkVariants}>
                  <Link href={buildHref(navCTA.href)} className={`${getCTAClassName(navCTA.variant || "primary")} w-full text-center text-base px-6 py-3`} onClick={() => { setIsMobileMenuOpen(false); mobileMenuToggleRef.current?.focus(); }}>
                    {navCTA.label}
                  </Link>
                </motion.div>
              )}

              {mounted && sessionUser && (
                <motion.div variants={linkVariants} className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground px-4 pb-2 truncate">{sessionUser.email}</p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-base font-medium text-foreground/80 hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
