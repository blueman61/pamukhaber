/** Pamuk Haber logosu: gülümseyen küçük bulut + yuvarlak kelime işareti. */
export function CloudMark({ className = "h-7 w-7" }: { className?: string }) {
  // Zemin CSS ile çizilir: aynı sayfada birden çok logo (biri gizli olsa bile) SVG gradyan kimliği çakıştırmasın.
  return (
    <span
      className={`inline-block shrink-0 overflow-hidden rounded-[31%] bg-gradient-to-br from-[#f9a8cb] to-[#a9d8ff] ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 48 48" className="block h-full w-full">
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
    </span>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 leading-none ${className}`}>
      <CloudMark className="h-7 w-7" />
      {/* pr: son harfin sağ boşluğu, pb: küçük harflerin optik ortası için */}
      <span className="block pr-0.5 pb-px text-[19px] leading-none font-black tracking-tight">
        pamuk<span className="text-accent">haber</span>
      </span>
    </span>
  );
}
