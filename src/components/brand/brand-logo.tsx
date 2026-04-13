import Image from "next/image";

import { cn } from "@/lib/utils/cn";

type BrandLogoProps = {
  className?: string;
  size?: "sm" | "md";
};

const sizeClasses: Record<NonNullable<BrandLogoProps["size"]>, string> = {
  sm: "h-9 w-[7.75rem] shrink-0 self-start",
  md: "h-11 w-[9.5rem] shrink-0 self-start",
};

export function BrandLogo({ className, size = "md" }: BrandLogoProps) {
  return (
    <span className={cn("logo-slot", sizeClasses[size], className)}>
      <Image
        src="/brand/dgi-logo-rgb-sort.png"
        alt="DGI"
        width={180}
        height={60}
        className="block h-full w-full object-contain object-left"
        priority
      />
    </span>
  );
}
