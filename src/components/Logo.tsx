export function LogoMark({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Selo Brasa Burger">
      <circle cx="32" cy="32" r="31" className="fill-primary" />
      <circle cx="32" cy="32" r="27" fill="none" className="stroke-primary-foreground" strokeWidth="1.5" strokeDasharray="2 3" />
      <path d="M32 9c3 5-2 7 1 11 2-2 3-4 2-6 4 3 5 9 0 12-3 2-8 1-9-3-1-4 4-7 6-14z" className="fill-primary-foreground" />
      <path d="M15 34c0-7 8-11 17-11s17 4 17 11z" className="fill-primary-foreground" />
      <rect x="13" y="37" width="38" height="4" rx="2" className="fill-primary-foreground" />
      <path d="M15 44h34c0 4-3 6-6 6H21c-3 0-6-2-6-6z" className="fill-primary-foreground" />
    </svg>
  );
}

export function Logo({ name = "Brasa Burger", logo }: { name?: string; logo?: string }) {
  return (
    <span className="flex items-center gap-2">
      {logo ? <img src={logo} alt={`Logo ${name}`} className="h-11 w-11 rounded-full object-cover" /> : <LogoMark size={44} />}
      <span className="font-display text-lg font-extrabold uppercase leading-none tracking-tight text-primary">{name}</span>
    </span>
  );
}
