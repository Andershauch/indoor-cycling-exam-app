type AdminStatCardProps = {
  label: string;
  value: string;
  helper?: string;
};

export function AdminStatCard({ label, value, helper }: AdminStatCardProps) {
  return (
    <div className="surface-card p-4">
      <p className="text-xs font-bold uppercase tracking-[0.08em]">{label}</p>
      <p className="mt-3 font-display text-[2.2rem] leading-none">{value}</p>
      {helper ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}
