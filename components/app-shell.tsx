import Link from "next/link";
import { Activity, Building2, CreditCard, LayoutDashboard, QrCode, ScanLine, Settings, ShieldCheck, Users, Bell, Search, ChevronDown } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import { Brand } from "./brand";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "./theme-toggle";

export function AppShell({user,children,section}:{user:AuthUser;children:React.ReactNode;section:string}){
  const platform=user.role==="PLATFORM_OWNER";
  const member=user.role==="MEMBER";
  const links=platform?[{href:"/platform/dashboard",label:"Dashboard",icon:LayoutDashboard,match:"command"},{href:"#gyms",label:"Gyms",icon:Building2,match:"gyms"},{href:"#applications",label:"Applications",icon:ShieldCheck,match:"applications"},{href:"#activity",label:"Activity logs",icon:Activity,match:"activity"}]:member?[{href:"/member/dashboard",label:"Dashboard",icon:LayoutDashboard,match:"dashboard"},{href:"#membership",label:"Membership",icon:CreditCard,match:"membership"},{href:"#qr",label:"My access QR",icon:QrCode,match:"qr"},{href:"#visits",label:"Visit history",icon:Activity,match:"visits"}]:[{href:"/gym/dashboard",label:"Dashboard",icon:LayoutDashboard,match:"dashboard"},{href:"#members",label:"Members",icon:Users,match:"members"},{href:"#memberships",label:"Membership plans",icon:CreditCard,match:"memberships"},{href:"/gym/scanner",label:"QR scanner",icon:ScanLine,match:"scanner"},{href:"#activity",label:"Access logs",icon:Activity,match:"activity"},{href:"/gym/settings",label:"Settings",icon:Settings,match:"settings"}];
  return <div className="app-frame lg:grid lg:grid-cols-[246px_minmax(0,1fr)]">
    <aside className="app-sidebar border-b p-4 sm:p-5 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-3"><Brand/></div>
      <div className="mt-7 rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] p-3"><p className="text-[.64rem] font-bold uppercase tracking-[.12em] text-[var(--muted)]">{platform?"Platform workspace":member?"Member account":"Current gym"}</p><div className="mt-1.5 flex items-center justify-between gap-2"><p className="truncate text-sm font-bold">{platform?"Global network":user.gym?.name}</p><ChevronDown size={14} className="shrink-0 text-[var(--muted)]"/></div><p className="mt-1 truncate text-xs text-[var(--muted)]">{user.role.replaceAll("_"," ")}</p></div>
      <p className="mb-2 mt-7 px-3 text-[.64rem] font-bold uppercase tracking-[.15em] text-[var(--muted)]">Workspace</p>
      <nav className="flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">{links.map(({href,label,icon:Icon,match})=><Link key={label} href={href} className={`app-nav-link shrink-0 ${section.toLowerCase().includes(match)||match===section?"active":""}`}><Icon size={17} strokeWidth={1.8}/><span>{label}</span></Link>)}</nav>
      <div className="mt-5 border-t border-[var(--line)] pt-4 lg:mt-6 lg:pt-5"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-lime-500/15 text-sm font-bold text-lime-600">{user.fullName.split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{user.fullName}</p><p className="truncate text-xs text-[var(--muted)]">{user.username}</p></div></div><div className="mt-4"><LogoutButton/></div></div>
    </aside>
    <main className="app-content">
      <header className="app-topline"><div className="flex min-w-0 items-center gap-3"><div className="min-w-0"><p className="text-xs text-[var(--muted)]">{platform?"Platform overview":member?"Your fitness account":"Gym management"}</p><p className="mt-1 truncate text-sm font-semibold">{platform?"Manage your gym network":member?`Welcome back, ${user.fullName}`:`${user.gym?.name ?? "Your gym"} · ${user.gym?.city ?? "Workspace"}`}</p></div></div><div className="flex shrink-0 items-center gap-2"><div className="hidden h-9 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-xs text-[var(--muted)] md:flex"><Search size={14}/>Search workspace…<span className="ml-3 rounded border border-[var(--line)] px-1.5 py-0.5">⌘ K</span></div><button aria-label="Notifications" className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--line)] bg-[var(--panel)] text-[var(--muted)]"><Bell size={16}/></button><ThemeToggle/></div></header>
      {children}
      <footer className="mt-12 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-5 text-[.7rem] text-[var(--muted)]"><span>© {new Date().getFullYear()} IRONCLAD Multi-Gym</span><span>Stronger systems. Healthier communities.</span></footer>
    </main>
  </div>;
}
