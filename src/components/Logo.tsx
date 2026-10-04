/** Pamuk Haber logosu: gülümseyen küçük bulut + yuvarlak kelime işareti. */
export function CloudMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id="pamuk-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f9a8cb" />
          <stop offset="1" stopColor="#a9d8ff" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="15" fill="url(#pamuk-mark)" />
      <g fill="#fff">
        <circle cx="17" cy="27" r="8" />
        <circle cx="25" cy="21" r="10" />
        <circle cx="32" cy="27" r="7" />
        <rect x="11" y="27" width="27" height="8" rx="4" />
      </g>
      <circle cx="21.5" cy="26" r="1.4" fill="#2e2433" />
      <circle cx="28.5" cy="26" r="1.4" fill="#2e2433" />
      <path d="M22.5 29.2q2.5 2.2 5 0" stroke="#2e2433" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <CloudMark />
      <span className="text-[19px] leading-none font-black tracking-tight">
        pamuk<span className="text-accent">haber</span>
      </span>
    </span>
  );
}
