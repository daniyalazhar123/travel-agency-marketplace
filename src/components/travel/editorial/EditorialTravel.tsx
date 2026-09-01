"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, MapPin, ArrowRight, BookOpen } from "lucide-react";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  image: string;
  category: string;
  author: string;
  authorRole?: string;
  authorImage?: string;
  publishDate: string;
  readTime: string;
  featured?: boolean;
  destination?: string;
}

interface EditorialTravelProps {
  articles: Article[];
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  currentTenantSlug?: string;
}

const easing = [0.4, 0, 0.2, 1] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easing },
  },
  hover: {
    y: -4,
    transition: { duration: 0.3, ease: easing },
  },
};

const defaultArticles: Article[] = [
  {
    id: "amalfi-hidden-gems",
    title: "Beyond Positano: The Amalfi Coast's Best-Kept Secrets",
    excerpt: "Discover the hidden villages, secluded beaches, and family-run trattorias that most visitors never find.",
    image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1200&q=80",
    category: "Destination Guide",
    author: "Elena Rossi",
    authorRole: "Senior Travel Editor",
    publishDate: "2024-03-15",
    readTime: "8 min read",
    featured: true,
    destination: "Amalfi Coast, Italy",
  },
  {
    id: "kyoto-seasons",
    title: "Kyoto Through the Seasons: When to Visit for the Perfect Experience",
    excerpt: "From cherry blossoms in spring to autumn maple leaves, each season transforms Japan's ancient capital into a different world.",
    image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80",
    category: "Seasonal Travel",
    author: "Kenji Tanaka",
    authorRole: "Japan Specialist",
    publishDate: "2024-03-10",
    readTime: "6 min read",
    featured: false,
    destination: "Kyoto, Japan",
  },
  {
    id: "sustainable-luxury",
    title: "The Rise of Conscious Luxury: Travel That Gives Back",
    excerpt: "How leading hotels and tour operators are redefining luxury through conservation, community empowerment, and cultural preservation.",
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
    category: "Travel Trends",
    author: "Sarah Mitchell",
    authorRole: "Sustainability Editor",
    publishDate: "2024-03-05",
    readTime: "10 min read",
    featured: false,
    destination: "Global",
  },
  {
    id: "maldives-new-resorts",
    title: "New Openings: The Maldives' Most Anticipated Resorts of 2024",
    excerpt: "From underwater villas to overwater observatories, this year's openings push the boundaries of island luxury.",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
    category: "New Openings",
    author: "Marcus Chen",
    authorRole: "Hotel Correspondent",
    publishDate: "2024-02-28",
    readTime: "7 min read",
    featured: false,
    destination: "Maldives",
  },
  {
    id: "japanese-ryokan-guide",
    title: "The Art of Ryokan: A Guide to Japan's Traditional Inns",
    excerpt: "Understanding kaiseki, onsen etiquette, and the philosophy of omotenashi at Japan's most exquisite ryokan.",
    image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80",
    category: "Cultural Insight",
    author: "Kenji Tanaka",
    authorRole: "Japan Specialist",
    publishDate: "2024-02-20",
    readTime: "9 min read",
    featured: false,
    destination: "Japan",
  },
  {
    id: "mediterranean-yachting",
    title: "Charting the Mediterranean: A Yachting Itinerary",
    excerpt: "From the French Riviera to the Greek islands, a week-long journey through the Mediterranean's most glamorous ports.",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
    category: "Itinerary",
    author: "Elena Rossi",
    authorRole: "Senior Travel Editor",
    publishDate: "2024-02-15",
    readTime: "12 min read",
    featured: false,
    destination: "Mediterranean",
  },
];

export function EditorialTravel({
  articles = defaultArticles,
  title = "Travel Journal",
  subtitle = "Stories, guides, and insights from the world's most extraordinary places",
  viewAllHref,
  viewAllLabel = "Read All Stories",
  currentTenantSlug = "",
}: EditorialTravelProps) {
  const resolvedViewAllHref = viewAllHref || `/${currentTenantSlug}/journal`;
  const featuredArticle = articles.find((a) => a.featured) || articles[0];
  const secondaryArticles = articles.filter((a) => a.id !== featuredArticle.id).slice(0, 4);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <section className="py-20 lg:py-28" aria-labelledby="editorial-heading">
      <div className="container-page">
        <motion.div className="max-w-3xl mb-16 lg:mb-20" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="label text-accent mb-4 inline-block">Editorial</span>
          <h2 id="editorial-heading" className="heading-section text-foreground mb-4">
            {title}
          </h2>
          <p className="body-lg text-balance">{subtitle}</p>
        </motion.div>

        {featuredArticle && (
          <motion.div
            className="mb-16 lg:mb-20"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Link
              href={`${resolvedViewAllHref}/${featuredArticle.id}`}
              className="group block"
              aria-label={`Read: ${featuredArticle.title}`}
            >
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                className="relative grid lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden elegant-shadow"
              >
                <div className="relative aspect-[3/4] lg:aspect-auto min-h-[500px] overflow-hidden">
                  <Image
                    src={featuredArticle.image}
                    alt=""
                    fill
                    priority
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    quality={90}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                    <div className="max-w-xl">
                      <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm mb-4">
                        <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium">{featuredArticle.category}</span>
                        {featuredArticle.destination && (
                          <>
                            <span aria-hidden="true">·</span>
                            <MapPin className="w-3 h-3" aria-hidden="true" />
                            <span>{featuredArticle.destination}</span>
                          </>
                        )}
                      </div>
                      <h3 className="heading-section text-white mb-4 group-hover:text-accent-light transition-colors">
                        {featuredArticle.title}
                      </h3>
                      <p className="text-white/90 text-lg mb-6">{featuredArticle.excerpt}</p>
                      <div className="flex items-center gap-6 text-white/80 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" aria-hidden="true" />
                          <time>{formatDate(featuredArticle.publishDate)}</time>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" aria-hidden="true" />
                          <span>{featuredArticle.readTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4" aria-hidden="true" />
                          <span>By {featuredArticle.author}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center bg-card">
                  <h4 className="label text-accent mb-6">Why This Matters</h4>
                  <p className="body-base text-foreground/80 mb-6 max-w-md">
                    {featuredArticle.content || "Expert insights and insider knowledge that transform a good trip into an unforgettable journey."}
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-border">
                    <div className="flex items-center gap-4">
                      {featuredArticle.authorImage && (
                        <Image
                          src={featuredArticle.authorImage}
                          alt=""
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium text-foreground text-sm">{featuredArticle.author}</p>
                        <p className="text-muted-foreground text-xs">{featuredArticle.authorRole}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-accent font-medium group-hover:gap-3 transition-all">
                      <span>Read Story</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        )}

        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {secondaryArticles.map((article, index) => (
            <motion.div key={article.id} variants={cardVariants} style={{ transitionDelay: `${index * 100}ms` }}>
              <Link
                href={`${resolvedViewAllHref}/${article.id}`}
                className="group block glass-card overflow-hidden aspect-[4/3] lg:aspect-auto min-h-[350px] elegant-shadow-hover flex flex-col"
                aria-label={`Read: ${article.title}`}
              >
                <div className="relative aspect-[4/3] lg:aspect-[16/9] overflow-hidden flex-shrink-0">
                  <Image
                    src={article.image}
                    alt=""
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    quality={85}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col flex-1">
                  <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm mb-3">
                    <span className="px-2 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium">{article.category}</span>
                    {article.destination && (
                      <>
                        <span aria-hidden="true">·</span>
                        <MapPin className="w-3 h-3" aria-hidden="true" />
                        <span>{article.destination}</span>
                      </>
                    )}
                  </div>
                  <h3 className="heading-card text-white mb-3 group-hover:text-accent-light transition-colors flex-1">
                    {article.title}
                  </h3>
                  <p className="text-white/80 text-sm mb-4 line-clamp-2 flex-1">{article.excerpt}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/20">
                    <div className="flex items-center gap-4 text-white/70 text-xs">
                      <time>{formatDate(article.publishDate)}</time>
                      <span aria-hidden="true">·</span>
                      <span>{article.readTime}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/80 group-hover:gap-2 transition-all font-medium">
                      <span className="text-sm">Read</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {resolvedViewAllHref && (
          <motion.div
            className="mt-12 lg:mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Link
              href={resolvedViewAllHref}
              className="btn-secondary inline-flex items-center gap-2 px-8 py-3.5 text-base"
            >
              {viewAllLabel}
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}