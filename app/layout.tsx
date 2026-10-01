import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: { default: "Ironclad — Multi-Gym OS", template: "%s · Ironclad" }, description: "Secure multi-tenant gym operations, access, and attendance.", icons: { icon: "/ironclad-icon.svg", shortcut: "/ironclad-icon.svg" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}

