type StatusBadgeProps = {
  children: string;
  color?: "cyan" | "emerald" | "amber" | "red";
};

const variants = {
  cyan: "bg-cyan-300/10 text-cyan-200",
  emerald: "bg-emerald-300/10 text-emerald-200",
  amber: "bg-amber-300/10 text-amber-200",
  red: "bg-red-300/10 text-red-200"
};

export function StatusBadge({
  children,
  color = "cyan"
}: StatusBadgeProps) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ${variants[color]}`}
    >
      {children}
    </span>
  );
}
