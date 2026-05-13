export const metadata = {
  title: "TrustLayer",
  description: "Compliance trust infrastructure"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
