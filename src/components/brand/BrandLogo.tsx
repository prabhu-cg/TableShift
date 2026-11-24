interface BrandLogoProps {
  className?: string;
  /** Hide the wordmark and show only the mark. */
  markOnly?: boolean;
}

/** Geometric mark: a wide desktop frame shifting into a narrow mobile frame. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1.5" y="6.5" width="19" height="14" rx="3" stroke="#252525" strokeWidth="2" />
      <path d="M1.5 12h19" stroke="#252525" strokeWidth="2" />
      <rect x="19" y="10" width="11.5" height="19" rx="3" fill="#C77935" />
      <rect x="22.5" y="13" width="4.5" height="2" rx="1" fill="#fff" />
      <rect x="22.5" y="17" width="4.5" height="2" rx="1" fill="#fff" opacity="0.7" />
      <rect x="22.5" y="21" width="4.5" height="2" rx="1" fill="#fff" opacity="0.7" />
    </svg>
  );
}

export function BrandLogo({ className = "", markOnly = false }: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark />
      {!markOnly && (
        <span className="text-[1.25rem] leading-none tracking-[-0.04em] text-ink">
          <span className="font-semibold">Table</span>
          <span className="font-light">Shift</span>
        </span>
      )}
      <span className="sr-only">TableShift</span>
    </span>
  );
}
