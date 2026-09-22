import type { Metadata } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import { PostHogProvider } from "@/lib/posthog/client";
import { ConsentBanner } from "@/components/consent-banner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DossierSûr — Vérification de dossiers locatifs",
    template: "%s | DossierSûr",
  },
  description:
    "Détectez les fraudes documentaires dans les dossiers de location en quelques secondes. Analyse automatique des bulletins de paie, CNI, avis d'imposition et plus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${dmSerifDisplay.variable} font-sans antialiased`}
      >
        <PostHogProvider>
          {children}
          <ConsentBanner />
        </PostHogProvider>
      </body>
    </html>
  );
}
