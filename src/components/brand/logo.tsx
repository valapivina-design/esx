import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    // SVG logo — use a plain img so Next/Image SVG restrictions do not apply.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/logo.svg"
      alt={siteConfig.name}
      width={520}
      height={140}
      {...(priority ? { fetchPriority: "high" as const } : {})}
      className={cn("h-11 w-auto", className)}
    />
  );
}
