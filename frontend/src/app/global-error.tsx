"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen p-8 flex items-center justify-center">
          <div className="max-w-md mx-auto space-y-6 text-center">
            <h1 className="text-4xl font-semibold text-foreground">Something went wrong!</h1>
            <p className="text-muted-foreground">
              {error.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
