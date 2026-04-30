import type { Metadata } from "next";
import "../styles/globals.css";
import ProtectedRoute from "@/components/ProtectedRoute";
import { BrandingProvider } from "@/providers/BrandingProvider";

export const metadata: Metadata = {
  title: "Digital Marketing Hub",
  description: "All-in-one platform for marketing agencies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <BrandingProvider>
          <ProtectedRoute>
            {children}
          </ProtectedRoute>
        </BrandingProvider>
      </body>
    </html>
  );
}
