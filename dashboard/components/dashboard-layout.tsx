"use client"

import type React from "react"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, FileText, Bug, Users, LogOut, Database } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/log", label: "User Logs", icon: FileText },
    { href: "/dashboard/crawler", label: "Crawler DB", icon: Database },
    { href: "/dashboard/bugs", label: "Bug Reports", icon: Bug },
    { href: "/dashboard/users", label: "Users", icon: Users },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card hidden lg:block">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b p-6">
            <h1 className="text-xl font-bold">Monitoring Dashboard</h1>
            <p className="text-sm text-muted-foreground">System Analytics</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant={isActive ? "secondary" : "ghost"} className="w-full justify-start gap-3">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="border-t p-4">
            <Button variant="outline" className="w-full justify-start gap-3 bg-transparent" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen p-4 md:p-8">{children}</main>
    </div>
  )
}
