"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
export function ThemeToggle() {
  const [dark,setDark]=useState(true);
  useEffect(()=>{ const saved=localStorage.getItem("theme"); const value=saved ? saved==="dark" : true; setDark(value); document.documentElement.classList.toggle("dark",value); },[]);
  return <button type="button" className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-xs font-semibold text-[var(--ink)] transition hover:border-lime-500" aria-label={`Switch to ${dark?"light":"dark"} mode`} title={`Switch to ${dark?"light":"dark"} mode`} onClick={()=>{ const next=!dark; setDark(next); document.documentElement.classList.toggle("dark",next); localStorage.setItem("theme",next?"dark":"light"); }}>{dark?<Moon size={14}/>:<Sun size={14}/>}<span>{dark?"Dark":"Light"}</span><span className={`relative h-[18px] w-8 rounded-full transition ${dark?"bg-lime-500":"bg-slate-300"}`}><span className={`absolute top-[3px] h-3 w-3 rounded-full bg-white shadow transition-all ${dark?"left-[17px]":"left-[3px]"}`}/></span></button>;
}
