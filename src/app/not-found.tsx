import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-mono text-xl font-bold mb-6">
        404
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-white mb-3">Page Not Found</h1>
      <p className="text-neutral-400 max-w-md mb-8 text-sm leading-relaxed">
        The page or resource you requested could not be found or may have moved.
      </p>
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-sm transition-all"
        >
          Return Home
        </Link>
        <Link
          href="/catalog"
          className="px-5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-sm font-medium transition-all"
        >
          Explore Catalog
        </Link>
      </div>
    </div>
  );
}
