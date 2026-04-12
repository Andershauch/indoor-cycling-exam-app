type StatusListProps = {
  items: string[];
};

export function StatusList({ items }: StatusListProps) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-[var(--radius-sm)] border-2 border-border bg-background-muted px-4 py-3 text-sm font-medium leading-6 text-foreground"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
