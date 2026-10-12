"use client";

/**
 * Client half of /[tenant]/journal.
 *
 * Owns the animated article grid (motion.div cards) and the Load More
 * button. Article data is static, so it lives here; the page passes
 * only the active category filter and the tenant slug.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { cardVariants } from "@/lib/motion-primitives";

interface JournalClientProps {
  tenantSlug: string;
  selectedCategory: string | undefined;
}

interface JournalArticle {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  author: string;
  authorRole: string;
  authorImage: string;
  date: string;
  readTime: string;
  destination: string;
  featured: boolean;
}

const sampleArticles: JournalArticle[] = [
  {
    id: "amalfi-hidden-gems",
    title: "Beyond the Postcard: Amalfi's Hidden Gems",
    excerpt: "Venture past the tourist crowds to discover secret beaches, family-run trattorias, and ancient pathways known only to locals.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    category: "Destination Guide",
    author: "Isabella Montenegro",
    authorRole: "Founder & Creative Director",
    authorImage: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&q=80",
    date: "2025-01-15",
    readTime: "8 min read",
    destination: "Amalfi Coast, Italy",
    featured: true,
  },
  {
    id: "kyoto-seasons",
    title: "Kyoto Through the Seasons: A Year-Round Guide",
    excerpt: "From cherry blossoms in spring to snow-dusted temples in winter, discover the magic of Japan's cultural capital in every season.",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
    category: "Seasonal Guide",
    author: "Marcus Chen",
    authorRole: "Head of Experience Design",
    authorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    date: "2025-01-10",
    readTime: "10 min read",
    destination: "Kyoto, Japan",
    featured: true,
  },
  {
    id: "santorini-sunset",
    title: "Chasing the Perfect Santorini Sunset",
    excerpt: "Insider tips on the best viewpoints, timing, and hidden spots for experiencing the world's most famous sunset.",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80",
    category: "Travel Tips",
    author: "Sophie Laurent",
    authorRole: "Director of Partnerships",
    authorImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=80",
    date: "2025-01-05",
    readTime: "6 min read",
    destination: "Santorini, Greece",
    featured: false,
  },
  {
    id: "maldives-marine-life",
    title: "Beneath the Surface: Maldives Marine Life",
    excerpt: "A marine biologist's guide to the incredible underwater world of the Maldives, from manta rays to whale sharks.",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
    category: "Nature & Wildlife",
    author: "James Okafor",
    authorRole: "Safari & Adventure Specialist",
    authorImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    date: "2025-01-02",
    readTime: "12 min read",
    destination: "Maldives",
    featured: false,
  },
  {
    id: "marrakech-souks",
    title: "Navigating Marrakech's Souks Like a Local",
    excerpt: "Master the art of bargaining, discover hidden workshops, and find authentic treasures in the labyrinthine markets of the Red City.",
    image: "https://images.unsplash.com/photo-1582718968968-7b3b2a1c7d9d?w=800&q=80",
    category: "Cultural Insights",
    author: "Isabella Montenegro",
    authorRole: "Founder & Creative Director",
    authorImage: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&q=80",
    date: "2024-12-28",
    readTime: "7 min read",
    destination: "Marrakech, Morocco",
    featured: false,
  },
  {
    id: "bora-bora-overwater",
    title: "The Art of Overwater Living in Bora Bora",
    excerpt: "From choosing the perfect bungalow to lagoon adventures, everything you need to know for the ultimate Polynesian escape.",
    image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80",
    category: "Luxury Travel",
    author: "Sophie Laurent",
    authorRole: "Director of Partnerships",
    authorImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=80",
    date: "2024-12-20",
    readTime: "9 min read",
    destination: "Bora Bora, French Polynesia",
    featured: true,
  },
];

export function JournalClient({ tenantSlug, selectedCategory }: JournalClientProps) {
  const articles = sampleArticles.filter(
    (article) => !selectedCategory || article.category === selectedCategory,
  );

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-2">
        {articles.map((article) => (
          <motion.div key={article.id} variants={cardVariants} whileHover="hover">
            <article
              className={`group glass-card overflow-hidden elegant-shadow-hover flex flex-col h-full ${article.featured ? "lg:col-span-2" : ""}`}
            >
              <Link href={`/${tenantSlug}/journal/${article.id}`} className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={article.image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" aria-hidden="true" />
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-accent/90 text-on-accent text-xs font-medium">
                    {article.category}
                  </span>
                  {article.featured && (
                    <span className="px-3 py-1 rounded-full bg-white/90 text-primary text-xs font-medium backdrop-blur-sm">
                      Featured
                    </span>
                  )}
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-sm font-medium mb-1">{article.destination}</p>
                  <p className="text-white/80 text-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3" aria-hidden="true" />
                    {new Date(article.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    <span className="mx-1">·</span>
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {article.readTime}
                  </p>
                </div>
              </Link>
              <div className="p-6 flex flex-col flex-1">
                <Link href={`/${tenantSlug}/journal/${article.id}`} className="group-hover:text-accent transition-colors">
                  <h2 className={`heading-card ${article.featured ? "text-2xl" : ""} text-foreground mb-3`}>
                    {article.title}
                  </h2>
                </Link>
                <p className="text-muted-foreground text-sm mb-4 flex-1 line-clamp-2">{article.excerpt}</p>
                <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                  <Link
                    href={`/${tenantSlug}/journal/${article.id}`}
                    className="flex items-center gap-2 text-sm text-foreground/70 hover:text-accent transition-colors"
                  >
                    <img
                      src={article.authorImage}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                      aria-hidden="true"
                    />
                    <div className="hidden sm:block">
                      <p className="font-medium text-foreground">{article.author}</p>
                      <p className="text-xs text-muted-foreground">{article.authorRole}</p>
                    </div>
                  </Link>
                  <span className="ml-auto flex items-center gap-1 text-accent font-medium text-sm group-hover:gap-2 transition-all">
                    Read Article
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </article>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 lg:mt-20 text-center">
        <motion.button
          className="btn-secondary btn-shimmer px-10 py-4 text-lg"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          Load More Articles
        </motion.button>
      </div>
    </>
  );
}
