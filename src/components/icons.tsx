type IconProps = { className?: string; filled?: boolean };

const base = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function HeartIcon({ className, filled }: IconProps) {
  return (
    <svg {...base} className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor">
      <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.2 3.4 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.6 0 5.5 3.7 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" />
    </svg>
  );
}

export function ShareIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} fill="none" stroke="currentColor">
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M12 3v12" />
      <path d="M7.5 7.5 12 3l4.5 4.5" />
    </svg>
  );
}

export function ExternalIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} fill="none" stroke="currentColor">
      <path d="M14 4h6v6" />
      <path d="M20 4 10 14" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

export function VolumeIcon({ className, filled }: IconProps) {
  return (
    <svg {...base} className={className} fill="none" stroke="currentColor">
      <path d="M11 5 6 9H3v6h3l5 4z" />
      {filled ? (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </>
      ) : (
        <>
          <path d="m16 9 5 6" />
          <path d="m21 9-5 6" />
        </>
      )}
    </svg>
  );
}
