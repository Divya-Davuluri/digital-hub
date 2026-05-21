'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function BioPage() {
  const { slug } = useParams();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadPage();
  }, [slug]);

  const loadPage = async () => {
    try {
      let apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (apiUrl) {
        apiUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
      } else if (typeof window === 'undefined') {
        apiUrl = 'https://digital-hub-3h88.onrender.com/api';
      } else {
        apiUrl = '/api';
      }
      const res = await fetch(`${apiUrl}/links/bio/${slug}`);
      const result = await res.json();
      
      if (result.success) {
        setPage(result.data);
      } else {
        setError(true);
      }
    } catch (err) {
      // Demo fallback if API fails
      if (slug === 'nike-marketing') {
        setPage({
          title: 'Nike Marketing',
          description: 'Official links for Nike Marketing',
          backgroundColor: '#111827',
          buttonStyle: 'rounded',
          buttonColor: '#ffffff',
          buttonTextColor: '#000000',
          links: [
            { id:'l1', title:'🌐 Official Website', url:'https://nike.com' },
            { id:'l2', title:'📸 Instagram', url:'https://instagram.com/nike' },
            { id:'l3', title:'🎵 TikTok', url:'https://tiktok.com/@nike' },
            { id:'l4', title:'🛍️ Shop Now', url:'https://nike.com/shop' },
          ]
        });
      } else if (slug === 'amazon-cart') {
        setPage({
          title: 'Amazon Cart Deals',
          description: 'Best deals and offers',
          backgroundColor: '#FF9900',
          buttonStyle: 'pill',
          buttonColor: '#232F3E',
          buttonTextColor: '#ffffff',
          links: [
            { id:'l5', title:'🛒 Shop All Deals', url:'https://amazon.com/deals' },
            { id:'l6', title:'⚡ Lightning Deals', url:'https://amazon.com/lightning' },
            { id:'l7', title:'📦 Track Order', url:'https://amazon.com/orders' },
          ]
        });
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = (link: any, e: React.MouseEvent<HTMLAnchorElement>) => {
    // Optionally track click without blocking navigation
    let apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      apiUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
    } else {
      apiUrl = '/api'; // client side fallback
    }
    
    fetch(`${apiUrl}/links/bio/${slug}/click/${link.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      keepalive: true
    }).catch(err => console.error('Failed to track click:', err));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );

  if (error || !page) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="text-center">
        <h1 className="text-6xl font-black mb-4">404</h1>
        <p className="text-slate-400 font-bold">Bio Page Not Found</p>
      </div>
    </div>
  );

  const buttonClass = {
    rounded: 'rounded-2xl',
    pill: 'rounded-full',
    square: 'rounded-none'
  }[page.buttonStyle as string] || 'rounded-2xl';

  return (
    <div 
      className="min-h-screen flex flex-col items-center p-8 transition-colors duration-500" 
      style={{ backgroundColor: page.backgroundColor }}
    >
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Profile */}
        <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 border border-white/20 shadow-xl">
           <span className="text-4xl">⚡</span>
        </div>
        
        <h1 className="text-2xl font-black text-white mb-2 text-center drop-shadow-md">
          {page.title}
        </h1>
        <p className="text-white/70 font-medium text-center mb-12 max-w-sm">
          {page.description}
        </p>

        {/* Links */}
        <div className="w-full space-y-4">
          {Array.isArray(page.links) && page.links.map((link: any) => (
            <a 
              key={link.id}
              href={link.url}
              onClick={(e) => handleLinkClick(link, e)}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-4 px-6 flex items-center justify-center text-center font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg ${buttonClass}`}
              style={{ 
                backgroundColor: page.buttonColor || '#ffffff',
                color: page.buttonTextColor || '#000000'
              }}
            >
              {link.title}
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-20 pb-8 text-center">
          <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">
            Powered by Digital Marketing Hub
          </p>
        </div>
      </div>
    </div>
  );
}
