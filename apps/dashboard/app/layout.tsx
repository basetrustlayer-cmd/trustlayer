export const metadata = {
  title: "TrustLayer Dashboard",
  description: "TrustLayer SaaS dashboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
