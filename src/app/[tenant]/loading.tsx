export default function TenantLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="container-page text-center py-20">
        <div className="max-w-md mx-auto">
          <div className="w-12 h-12 mx-auto mb-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" aria-label="Loading tenant" />
          <p className="body-base text-muted-foreground">
            Loading agency...
          </p>
        </div>
      </div>
    </div>
  );
}