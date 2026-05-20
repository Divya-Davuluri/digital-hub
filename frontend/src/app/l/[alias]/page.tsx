import { redirect } from 'next/navigation';

export default async function ShortLinkRedirectPage({ params }: { params: { alias: string } }) {
  const { alias } = params;
  // Make sure we hit the API appropriately from the server side.
  let apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    apiUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
  } else if (typeof window === 'undefined') {
    apiUrl = 'https://digital-hub-og1a.onrender.com/api';
  } else {
    apiUrl = '/api';
  }

  try {
    const res = await fetch(`${apiUrl}/links/track/${alias}`, { cache: 'no-store' });
    const result = await res.json();

    if (result.success && result.data?.originalUrl) {
      redirect(result.data.originalUrl);
    }

    if (result.message === 'inactive') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white flex-col text-center p-6">
          <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl text-rose-500">⏸️</span>
          </div>
          <h1 className="text-4xl font-black mb-4">Link Inactive</h1>
          <p className="text-slate-400 font-bold max-w-sm">This link has been paused and is currently inactive.</p>
        </div>
      );
    }
  } catch (error) {
    // If API fails, fall through to Not Found
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white flex-col text-center p-6">
      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-xl border border-white/10">
        <span className="text-4xl">🔗</span>
      </div>
      <h1 className="text-4xl font-black mb-4">Short link not found</h1>
      <p className="text-slate-400 font-bold max-w-sm">The link you are looking for does not exist or may have been deleted.</p>
    </div>
  );
}
