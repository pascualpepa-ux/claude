export function LogoMarca({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bz-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="0.55" stopColor="#7c5cff" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path d="M20 2.5 35.2 11.25v17.5L20 37.5 4.8 28.75v-17.5z" fill="url(#bz-g)" />
      <path d="M16 13.5v13l11-6.5z" fill="#0b0b14" />
      <circle cx="31" cy="8" r="2.2" fill="#fbbf24" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMarca />
      <span className="text-xl font-extrabold tracking-tight">
        Bit<span className="text-marca-2">zy</span>
      </span>
    </span>
  );
}
