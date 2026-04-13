import Image from "next/image";

import { cn } from "@/lib/utils/cn";

type BrandLogoProps = {
  className?: string;
  size?: "sm" | "md";
};

const sizeClasses: Record<NonNullable<BrandLogoProps["size"]>, string> = {
  sm: "h-10 w-[7.5rem]",
  md: "h-12 w-[9rem]",
};

export function BrandLogo({ className, size = "md" }: BrandLogoProps) {
  return (
    <span className={cn("logo-slot", sizeClasses[size], className)}>
      <Image
        src="/brand/dgi-logo-rgb-sort.png"
        alt="DGI"
        width={180}
        height={60}
        className="h-auto w-full"
        priority
      />
    </span>
  );
}
