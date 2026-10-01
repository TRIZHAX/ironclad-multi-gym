import Link from "next/link";
import { Activity, Building2, CreditCard, LayoutDashboard, QrCode, ScanLine, Settings, ShieldCheck, Users } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import { Brand } from "./brand";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "./theme-toggle";

export function AppShell({user,children,section}:{user:AuthUser;children:React.ReactNode;section:string}){
  const platform=user.role==="PLATFORM_OWNER";
  const member=user.role==="MEMBER";
  const links=platform?[{href:"/platform/dashboard",label:"Command center",icon:LayoutDashboard},{href:"#gyms",label:"Gym network",icon:Building2},{href:"#applications",label:"Applications",icon:ShieldCheck},{href:"#activity",label:"Audit trail",icon:Activity}]:member?[{href:"/member/dashboard",label:"My dashboard",icon:LayoutDashboard},{href:"#membership",label:"Membership",icon:CreditCard},{href:"#qr",label:"My access QR",icon:QrCode},{href:"#visits",label:"Visit history",icon:Activity}]:[{href:"/gym/dashboard",label:"Dashboard",icon:LayoutDashboard},{href:"#members",label:"Members",icon:Users},{href:"#memberships",label:"Memberships",icon:CreditCard},{href:"/gym/scanner",label:"QR scanner",icon:ScanLine},{href:"#activity",label:"Access logs",icon:Activity},{href:"/gym/settings",label:"Gym settings",icon:Settings}];
  return <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]"><aside className="border-b border-[var(--line)] bg-[var(--panel)] p-5 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r"><div className="flex items-center justify-between"><Brand/><ThemeToggle/></div><div className="mt-9 border-y border-[var(--line)] py-4"><p className="eyebrow text-[var(--ember)]">{platform?"Platform control":member?"Member access":"Current gym"}</p><p className="mt-2 font-black">{platform?"Global network":user.gym?.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{user.fullName} · {user.role.replaceAll("_"," ")}</p></div><nav className="mt-6 flex gap-2 overflow-x-auto lg:block lg:space-y-1">{links.map(({href,label,icon:Icon})=><Link key={label} href={href} className={`flex shrink-0 items-center gap-3 border-l-2 px-3 py-3 text-sm font-bold ${label.toLowerCase().includes(section.toLowerCase())?"border-[var(--ember)] bg-[color-mix(in_srgb,var(--ember)_8%,transparent)]":"border-transparent text-[var(--muted)] hover:text-[var(--ink)]"}`}><Icon size={17}/>{label}</Link>)}</nav><div className="mt-8 lg:absolute lg:bottom-6"><LogoutButton/></div></aside><main className="min-w-0 p-5 sm:p-8 lg:p-10">{children}</main></div>
}
