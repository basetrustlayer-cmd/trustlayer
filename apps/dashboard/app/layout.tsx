import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TrustLayer Dashboard",
    template: "%s | TrustLayer",
  },
  description:
    "TrustLayer identity, reputation, risk, and trust infrastructure dashboard.",
  applicationName: "TrustLayer",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "TrustLayer Dashboard",
    description:
      "Identity verification, TrustScore intelligence, fraud monitoring, and compliance operations.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrustLayer Dashboard",
    description:
      "Identity verification, TrustScore intelligence, fraud monitoring, and compliance operations.",
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
