import Link from "next/link";
export function Brand({ compact=false }: { compact?: boolean }) {
  return <Link href="/" className="inline-flex items-center gap-3" aria-label="Ironclad home"><span className="grid h-9 w-9 rotate-3 place-items-center bg-[var(--acid)] text-lg font-black text-black">I</span>{!compact && <span className="display text-xl tracking-[-.06em]">IRONCLAD</span>}</Link>;
}

