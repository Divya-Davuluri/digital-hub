'use client';

export default function LinkNotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🔗</span>
        </div>
        <h1 className="text-2xl font-black text-white mb-3">
          Link Not Found
        </h1>
        <p className="text-slate-400 mb-8 max-w-sm mx-auto">
          The link you are looking for does not exist or may have been deleted.
        </p>
        <a
          href="/"
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
