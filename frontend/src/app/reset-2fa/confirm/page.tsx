import { Suspense } from 'react';
import ConfirmContent from './ConfirmContent';



export default function Reset2FAConfirmPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
        <div className="absolute top-1/4 right-1/4 w-[60%] h-[60%] bg-red-500/10 blur-[120px] rounded-full" />
      </div>
      
      <Suspense fallback={
        <div className="w-full max-w-[440px] card p-10 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-muted">Loading...</p>
        </div>
      }>
        <ConfirmContent />
      </Suspense>
    </main>
  );
}
