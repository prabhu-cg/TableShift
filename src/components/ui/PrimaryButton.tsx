import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-black shadow-card",
  secondary: "bg-canvas text-ink border border-line-strong hover:bg-surface",
  ghost: "bg-transparent text-ink-muted hover:bg-surface hover:text-ink",
};

export function PrimaryButton({
  variant = "primary",
  icon,
  className = "",
  children,
  type = "button",
  ...rest
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-5 text-[0.9375rem] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
