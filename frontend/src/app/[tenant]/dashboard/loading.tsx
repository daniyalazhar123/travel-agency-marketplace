export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background pt-20 lg:pt-24 pb-16">
      <div className="container-page">
        <div className="animate-pulse space-y-8">
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-1/4 max-w-xs" />
            <div className="h-4 bg-muted rounded w-1/2 max-w-md" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-10 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-6 bg-muted rounded w-1/3" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-1/3" />
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}