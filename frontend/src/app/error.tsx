"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="container-page text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <svg
              className="w-16 h-16 mx-auto text-muted-foreground/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="heading-section text-foreground mb-4">
            Something went wrong
          </h1>
          <p className="body-base text-muted-foreground mb-8">
            This page encountered an error. Please try again or navigate back.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="btn-primary"
              aria-label="Try again"
            >
              Try again
            </button>
            <Link
              href="/"
              className="btn-secondary"
              aria-label="Go home"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}