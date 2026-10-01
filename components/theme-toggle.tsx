"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
export function ThemeToggle() {
  const [dark,setDark]=useState(false);
  useEffect(()=>{ const value=localStorage.getItem("theme")==="dark"; setDark(value); document.documentElement.classList.toggle("dark",value); },[]);
  return <button className="btn !h-10 !min-h-0 !px-3" aria-label="Toggle color theme" onClick={()=>{ const next=!dark; setDark(next); document.documentElement.classList.toggle("dark",next); localStorage.setItem("theme",next?"dark":"light"); }}>{dark?<Sun size={15}/>:<Moon size={15}/>}</button>;
}

