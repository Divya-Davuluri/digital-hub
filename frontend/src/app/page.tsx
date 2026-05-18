import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-text selection:bg-primary/30">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="flex items-center justify-between px-32 py-16 max-w-7xl mx-auto border-b border-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="text-2xl font-bold tracking-tighter flex items-center gap-8">
          <div className="w-32 h-32 bg-primary rounded-md flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-sm rotate-45" />
          </div>
          DigitalMarketing<span className="text-primary">Hub</span>
        </div>
        <div className="flex gap-16 items-center">
          <Link href="/contact" className="text-text-muted hover:text-text transition-colors font-medium">Contact Us</Link>
          <Link href="/login" className="text-text-muted hover:text-text transition-colors font-medium">Login</Link>
          <Link href="/signup" className="btn-primary !px-16 !py-8 text-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-32 py-32 md:py-64 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-8 px-16 py-4 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary mb-16">
          <span className="relative flex h-8 w-8">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-8 w-8 bg-primary"></span>
          </span>
          v2.0 is now live
        </div>
        <h1 className="text-5xl md:text-8xl font-extrabold tracking-tight mb-16 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
          The Operating System for <br />
          <span className="text-primary">Modern Agencies</span>
        </h1>
        <p className="text-lg md:text-xl text-text-muted max-w-2xl mb-32">
          Scale your agency with an all-in-one platform for project management, client reporting, and automated marketing workflows.
        </p>
        <div className="flex flex-col sm:flex-row gap-16">
          <button className="btn-primary">
            Start Free Trial
          </button>
          <button className="btn-secondary">
            Book a Demo
          </button>
        </div>
        
        {/* Product Preview */}
        <div className="mt-64 w-full max-w-6xl aspect-[16/9] card border-white/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:opacity-100 transition-opacity" />
          <div className="relative h-full w-full flex items-center justify-center border border-white/5 rounded-lg bg-background/50">
             <div className="flex flex-col items-center gap-16">
               <div className="w-64 h-64 border-t-2 border-primary rounded-full animate-spin" />
               <span className="text-text-muted font-medium">Loading Dashboard Preview...</span>
             </div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="max-w-7xl mx-auto px-32 py-32 grid md:grid-cols-3 gap-32">
        {[
          { title: "Smart Automation", desc: "Automate repetitive tasks and focus on strategy." },
          { title: "Real-time Analytics", desc: "Deep insights into your agency's performance." },
          { title: "Client Portals", desc: "Give your clients a premium experience." }
        ].map((feature, i) => (
          <div key={i} className="card hover:border-primary/50 transition-colors">
            <h3 className="text-xl font-bold mb-8">{feature.title}</h3>
            <p className="text-text-muted text-sm leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
