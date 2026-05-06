import type { Metadata } from "next";
import "../styles/globals.css";
import ProtectedRoute from "@/components/ProtectedRoute";
import { BrandingProvider } from "@/context/BrandingContext";
import { Outfit, Lexend } from 'next/font/google';

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
});

const lexend = Lexend({ 
  subsets: ['latin'],
  variable: '--font-lexend',
});

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
    <html lang="en" className={`${outfit.variable} ${lexend.variable}`}>
      <body className="antialiased">
        <BrandingProvider>
          <ProtectedRoute>
            {children}
          </ProtectedRoute>
        </BrandingProvider>
      </body>
    </html>
  );
}
