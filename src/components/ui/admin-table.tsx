import type { ReactNode } from "react";

type AdminTableColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
};

type AdminTableRow = Record<string, ReactNode>;

type AdminTableProps = {
  caption?: string;
  columns: AdminTableColumn[];
  rows: AdminTableRow[];
  emptyMessage?: string;
};

export function AdminTable({
  caption,
  columns,
  rows,
  emptyMessage = "Ingen data endnu.",
}: AdminTableProps) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="table-scroll">
        <table className="min-w-full border-collapse">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="bg-background-soft">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`border-b border-border-soft px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] ${
                    column.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={`row-${index}`}
                  className="border-b border-border-soft last:border-b-0"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-4 align-top text-sm ${
                        column.align === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      {row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
