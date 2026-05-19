import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink-950 text-bone-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="font-display text-[10rem] leading-none text-bone-50/10">404</div>
        <h1 className="font-display text-4xl mb-3">
          Page <span className="italic">not found.</span>
        </h1>
        <p className="text-bone-300/80 mb-8">
          The page you're looking for doesn't exist, or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-bone-50 text-ink-950 rounded-full font-medium hover:bg-white transition-colors"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
