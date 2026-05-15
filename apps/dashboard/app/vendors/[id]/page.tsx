import Link from "next/link";

export default async function PublicProfilePage() {
  return (
    <main
      style={{
        padding: 40,
        fontFamily: "Arial, sans-serif",
        maxWidth: 860
      }}
    >
      <h1>Public Profile</h1>

      <p>
        Legacy vendor public profiles have been retired.
      </p>

      <p>
        Future public profiles will be generated from identity verification
        and TrustScore data.
      </p>

      <p style={{ marginTop: 24 }}>
        <Link href="/vendors">Back to public directory</Link>
      </p>
    </main>
  );
}
