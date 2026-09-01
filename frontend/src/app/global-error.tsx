"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Something went wrong</title>
      </head>
      <body className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="container-page text-center py-20">
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
              We encountered an unexpected error. Our team has been notified.
            </p>
            <button
              onClick={reset}
              className="btn-primary"
              aria-label="Try again"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}