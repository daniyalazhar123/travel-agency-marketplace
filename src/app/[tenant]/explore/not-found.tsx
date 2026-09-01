import Link from "next/link";

export default function ExploreNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="container-page text-center py-20">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <svg
              className="w-24 h-24 mx-auto text-muted-foreground/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="heading-section text-foreground mb-4">
            Destination not found
          </h1>
          <p className="body-base text-muted-foreground mb-8">
            Sorry, we couldn&apos;t find that destination. It might have been removed or the URL might be incorrect.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/explore" className="btn-primary">
              Browse destinations
            </Link>
            <Link href="/" className="btn-secondary">
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}