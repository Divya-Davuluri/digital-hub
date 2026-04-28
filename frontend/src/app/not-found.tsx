import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary animate-gradient mb-6">
        404
      </h1>
      <h2 className="text-3xl font-extrabold mb-4">Page Not Found</h2>
      <p className="text-text-muted mb-8 max-w-md text-center font-medium">
        The dashboard module you are looking for does not exist, or you do not have permission to view it.
      </p>
      
      <Link 
        href="/dashboard"
        className="btn-primary"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
