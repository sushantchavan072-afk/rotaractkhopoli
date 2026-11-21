import * as React from "react";

// shadcn's Badge, without Tailwind or class-variance-authority: the variants are plain classes
// styled in app/globals.css (.badge, .badge-default, .badge-secondary, .badge-outline).

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

export function badgeVariants({ variant = "default" }: { variant?: BadgeVariant } = {}) {
  return `badge badge-${variant}`;
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  return <div className={`${badgeVariants({ variant })} ${className}`.trim()} {...props} />;
}

export default Badge;
