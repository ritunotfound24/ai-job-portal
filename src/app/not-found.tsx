import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-2 text-ink/60">That job may have been removed.</p>
      <Link href="/jobs" className="btn mt-6">Browse jobs</Link>
    </div>
  );
}
