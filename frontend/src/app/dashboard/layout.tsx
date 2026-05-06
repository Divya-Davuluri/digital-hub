import { BrandingProvider } from "@/context/BrandingContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrandingProvider>
      <div style={{ background: '#f9fafb', minHeight: '100vh' }}>
        {children}
      </div>
    </BrandingProvider>
  );
}
