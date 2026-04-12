import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

type PlaceholderCardProps = {
  title: string;
  description: string;
  children?: ReactNode;
  tone?: "default" | "strong" | "contrast";
};

export function PlaceholderCard({
  title,
  description,
  children,
  tone = "default",
}: PlaceholderCardProps) {
  return (
    <Card title={title} tone={tone}>
      <p className="text-base leading-7 text-muted-foreground">{description}</p>
      {children ? <div className="mt-5">{children}</div> : null}
    </Card>
  );
}
