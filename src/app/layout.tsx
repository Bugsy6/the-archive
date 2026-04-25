import type { Metadata } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import "./globals.css"
import { AppSidebar } from "@/components/AppSidebar"
import { Toaster } from "@/components/ui/sonner"
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { MenuIcon } from "lucide-react"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "The Archive",
  description: "Your personal collection catalogue",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex bg-zinc-900 text-zinc-100">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 bg-zinc-800 border-r border-zinc-700 h-screen sticky top-0">
          <AppSidebar />
        </aside>

        {/* Mobile sidebar via Sheet */}
        <div className="md:hidden fixed top-0 left-0 z-40 p-3">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="text-zinc-300" />
              }
            >
              <MenuIcon className="size-5" />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-zinc-800 border-zinc-700">
              <AppSidebar />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main content */}
        <main className="flex-1 min-h-screen overflow-auto">
          {children}
        </main>

        <Toaster richColors />
      </body>
    </html>
  )
}
