export default function ExploreLoading() {
  return (
    <div className="min-h-screen bg-background pt-20 lg:pt-24">
      <div className="container-page">
        <div className="space-y-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4 max-w-md" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="aspect-[4/3] bg-muted rounded-2xl" />
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}