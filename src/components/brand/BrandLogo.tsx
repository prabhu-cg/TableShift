interface BrandLogoProps {
  className?: string;
  /** Hide the wordmark and show only the mark. */
  markOnly?: boolean;
  size?: "md" | "sm";
}

/** Geometric mark: a wide desktop frame shifting into a narrow amber mobile frame. */
export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className="text-text"
    >
      <rect x="1.5" y="6.5" width="19" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M1.5 12h19" stroke="currentColor" strokeWidth="2" />
      <rect x="19" y="10" width="11.5" height="19" rx="3" className="fill-primary" stroke="currentColor" strokeWidth="2" />
      <rect x="22.5" y="14" width="4.5" height="2" rx="1" className="fill-primary-foreground" />
      <rect x="22.5" y="18" width="4.5" height="2" rx="1" className="fill-primary-foreground" opacity="0.7" />
      <rect x="22.5" y="22" width="4.5" height="2" rx="1" className="fill-primary-foreground" opacity="0.7" />
    </svg>
  );
}

export function BrandLogo({ className = "", markOnly = false, size = "md" }: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark size={size === "sm" ? 24 : 30} />
      {!markOnly && (
        <span className={`font-display leading-none text-text ${size === "sm" ? "text-lg" : "text-[1.375rem]"}`}>
          Table<span className="text-text-muted">Shift</span>
        </span>
      )}
      <span className="sr-only">TableShift</span>
    </span>
  );
}
