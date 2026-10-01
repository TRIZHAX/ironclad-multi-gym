import Link from "next/link";
import { Activity, Building2, CreditCard, LayoutDashboard, QrCode, ScanLine, Settings, ShieldCheck, Users, Dumbbell } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import { Brand } from "./brand";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "./theme-toggle";

export function AppShell({ user, children, section }: { user: AuthUser; children: React.ReactNode; section: string }) {
  const platform = user.role === "PLATFORM_OWNER";
  const member = user.role === "MEMBER";
  const links = platform
    ? [{ href: "/platform/dashboard", label: "Command center", icon: LayoutDashboard }, { href: "#gyms", label: "Gym network", icon: Building2 }, { href: "#applications", label: "Applications", icon: ShieldCheck }, { href: "#activity", label: "Audit trail", icon: Activity }]
    : member
      ? [{ href: "/member/dashboard", label: "My dashboard", icon: LayoutDashboard }, { href: "#membership", label: "Membership", icon: CreditCard }, { href: "#qr", label: "My access QR", icon: QrCode }, { href: "#visits", label: "Visit history", icon: Activity }]
      : [{ href: "/gym/dashboard", label: "Dashboard", icon: LayoutDashboard }, { href: "#members", label: "Members", icon: Users }, { href: "#memberships", label: "Memberships", icon: CreditCard }, { href: "/gym/scanner", label: "QR scanner", icon: ScanLine }, { href: "#activity", label: "Access logs", icon: Activity }, { href: "/gym/settings", label: "Gym settings", icon: Settings }];
  return <div className="app-layout">
    <aside className="app-sidebar">
      <div className="sidebar-top"><Brand /><div className="sidebar-theme"><ThemeToggle /></div></div>
      <div className="workspace-card"><span className="workspace-icon"><Dumbbell size={17} /></span><div className="min-w-0"><p className="eyebrow">{platform ? "Platform control" : member ? "Member workspace" : "Current gym"}</p><p className="workspace-name">{platform ? "Global network" : user.gym?.name ?? "Your gym"}</p><p className="workspace-meta">{user.role.replaceAll("_", " ")}</p></div></div>
      <p className="nav-label">WORKSPACE</p>
      <nav className="app-nav">{links.map(({ href, label, icon: Icon }) => {
        const active = label.toLowerCase().includes(section.toLowerCase()) || (section === "dashboard" && label.toLowerCase().includes("dashboard"));
        return <Link key={label} href={href} className={`nav-link ${active ? "active" : ""}`}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{active && <span className="nav-active-dot" />}</Link>;
      })}</nav>
      <div className="sidebar-bottom"><div className="profile-mini"><div className="profile-avatar">{user.fullName.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase()}</div><div className="profile-copy"><strong>{user.fullName}</strong><span>{user.role.replaceAll("_", " ").toLowerCase()}</span></div></div><LogoutButton /></div>
    </aside>
    <main className="app-main"><header className="mobile-app-header"><Brand /><ThemeToggle /></header><div className="main-content">{children}</div><footer className="app-footer"><span>IRONCLAD MULTI-GYM</span><span>Stronger systems. Healthier communities.</span></footer></main>
  </div>;
}
