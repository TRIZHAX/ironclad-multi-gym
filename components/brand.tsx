import Link from "next/link";
export function Brand({ compact=false }: { compact?: boolean }) {
  return <Link href="/" className="inline-flex items-center gap-2.5 shrink-0" aria-label="Ironclad home">
    <svg aria-hidden="true" width="36" height="36" viewBox="0 0 48 48" fill="none">
      <path d="M7 17h5v14H7zM15 10h5v28h-5zM23 5h5v38h-5zM31 12h5v24h-5zM39 18h3v12h-3z" fill="#84CC16"/>
      <path d="M25 12 34 6v36l-9-6V12Z" fill="#B8F36A"/>
    </svg>
    {!compact && <span className="flex flex-col leading-none"><span className="text-[1.12rem] font-extrabold tracking-[-.055em]">IRONCLAD</span><span className="mt-1 text-[.52rem] font-bold tracking-[.2em] text-[var(--muted)]">MULTI-GYM SYSTEM</span></span>}
  </Link>;
}
