import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand-mark" aria-label="Ironclad Multi-Gym home">
      <svg aria-hidden="true" viewBox="0 0 48 48" className="brand-symbol" fill="none">
        <path d="M5 17h4v14H5zM11 10h4v28h-4zM17 5h4v38h-4z" fill="currentColor" />
        <path d="M26 8h8l8 8v16l-8 8h-8v-7h5l4-4V19l-4-4h-5z" fill="currentColor" />
        <path d="M25 17h6v14h-6z" fill="#101411" />
      </svg>
      {!compact && <span className="brand-copy"><strong>IRONCLAD</strong><small>MULTI-GYM SYSTEM</small></span>}
    </Link>
  );
}
