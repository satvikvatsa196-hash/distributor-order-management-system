import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ToastProvider } from "@/components/ui/use-toast"

export const metadata: Metadata = {
  title: "Company A | Jabalpur FMCG Order Portal",
  description: "Next-generation B2B order management system for 1,800+ kirana stores in Jabalpur. Fast ordering, AI message capture, real-time schemes & Tally sync.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e3a8a",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full bg-slate-50 antialiased">
      <body className="min-h-full flex flex-col font-sans text-slate-900 bg-slate-50 selection:bg-blue-100">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
