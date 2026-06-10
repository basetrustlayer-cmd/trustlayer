import { StatusBadge } from "./status-badge";

type TrustScoreCardProps = {
  score: number;
  band: string;
  confidence?: number;
  verificationTier?: string;
};

export function TrustScoreCard({
  score,
  band,
  confidence,
  verificationTier
}: TrustScoreCardProps) {
  return (
    <article className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6">
      <p className="text-sm text-cyan-100">TrustScore</p>

      <p className="mt-2 text-5xl font-semibold text-white">
        {score}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge color="cyan">
          {band}
        </StatusBadge>

        {verificationTier ? (
          <StatusBadge color="emerald">
            {verificationTier}
          </StatusBadge>
        ) : null}
      </div>

      {confidence !== undefined ? (
        <p className="mt-4 text-sm text-cyan-50">
          Confidence: {Math.round(confidence * 100)}%
        </p>
      ) : null}
    </article>
  );
}
