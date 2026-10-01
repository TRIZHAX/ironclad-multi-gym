"use client";
import { LogOut } from "lucide-react";
export function LogoutButton(){ return <button className="flex items-center gap-3 text-sm font-bold text-[var(--muted)] hover:text-[var(--ember)]" onClick={async()=>{await fetch("/api/auth/logout",{method:"POST"}); location.href="/login";}}><LogOut size={17}/> Sign out</button>; }

