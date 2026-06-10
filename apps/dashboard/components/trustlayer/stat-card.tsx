type StatCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      {detail ? <p className="mt-2 text-sm text-cyan-200">{detail}</p> : null}
    </article>
  );
}
