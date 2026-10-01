import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Ironclad — Multi-Gym OS", template: "%s · Ironclad" },
  description: "Secure multi-tenant gym operations, access, and attendance.",
  applicationName: "IRONCLAD Multi-Gym System",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/ironclad-192.png", sizes: "192x192", type: "image/png" },
      { url: "/ironclad-logo.svg", type: "image/svg+xml" }
    ],
    apple: [{ url: "/icons/ironclad-192.png", sizes: "192x192", type: "image/png" }]
  },
  appleWebApp: { capable: true, title: "IRONCLAD", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="dark" suppressHydrationWarning><body>{children}</body></html>;
}

