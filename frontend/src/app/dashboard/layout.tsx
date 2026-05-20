import { BrandingProvider } from "@/context/BrandingContext";
import AuthGuard from "@/components/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrandingProvider>
      <AuthGuard>
        <div className="min-h-screen bg-slate-50">
          {children}
        </div>
      </AuthGuard>
    </BrandingProvider>
  );
}
