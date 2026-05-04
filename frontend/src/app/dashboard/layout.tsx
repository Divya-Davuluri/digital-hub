import { BrandingProvider } from "@/context/BrandingContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrandingProvider>
      <div className="min-h-screen bg-slate-50">
        {children}
      </div>
    </BrandingProvider>
  );
}
