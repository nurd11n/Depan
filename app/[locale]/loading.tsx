export default function Loading() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 pt-16">
      <div
        className="h-9 w-9 animate-spin rounded-full border border-border border-t-gold"
        role="status"
        aria-label="Loading"
      />
    </main>
  );
}
