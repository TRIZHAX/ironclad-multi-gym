import { UserRole } from "@prisma/client";
import { requireGym, requirePageUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { QRScanner } from "@/components/qr-scanner";
export default async function ScannerPage(){const user=await requirePageUser([UserRole.GYM_OWNER,UserRole.ADMIN]);requireGym(user);return <AppShell user={user} section="QR scanner"><div className="mx-auto max-w-4xl"><p className="eyebrow text-[var(--ember)]">{user.gym!.name} / Secure entrance</p><h1 className="display mt-2 text-5xl sm:text-6xl">SCAN ACCESS</h1><div className="mt-8"><QRScanner/></div></div></AppShell>}
