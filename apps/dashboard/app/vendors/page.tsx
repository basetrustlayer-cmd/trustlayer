import Link from "next/link";

export default function PlatformsDirectoryPage() {
  return (
    <main
      style={{
        padding: 40,
        fontFamily: "Arial, sans-serif",
        maxWidth: 960
      }}
    >
      <h1>Public Directory</h1>

      <p>
        The legacy vendor directory has been retired.
      </p>

      <p>
        TrustLayer is being repositioned as an identity verification and
        TrustScore infrastructure platform for software integrators.
      </p>

      <p>
        A new public directory based on Platforms, Subjects, and verified
        trust data will be introduced in a future release.
      </p>

      <p style={{ marginTop: 24 }}>
        <Link href="/">Back to dashboard</Link>
      </p>
    </main>
  );
}
