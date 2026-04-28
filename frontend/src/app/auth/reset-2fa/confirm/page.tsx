import { Suspense } from 'react';
import ConfirmContent from './ConfirmContent';



export default function Confirm2FAResetPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface dark:bg-black px-lg">
      <Suspense fallback={
        <div className="w-full max-w-md bg-background rounded-xl p-lg text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading verification...</p>
        </div>
      }>
        <ConfirmContent />
      </Suspense>
    </main>
  );
}
