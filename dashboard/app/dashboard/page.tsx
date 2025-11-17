import { DashboardLayout } from "@/components/dashboard-layout"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Bug, FileText, Activity, Clock, Database, HardDrive } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

async function getStats() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/stats`, {
      cache: "no-store",
    })
    if (!response.ok) throw new Error("Failed to fetch stats")
    return await response.json()
  } catch (error) {
    console.error("Error fetching stats:", error)
    return {
      totalUsers: 0,
      totalBugs: 0,
      totalLogEntries: 0,
      recentBugs: 0,
      activeUsers: 0,
      bugsByVersion: [],
    }
  }
}

async function getTodayLogs() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/log/today`, {
      cache: "no-store",
    })
    if (!response.ok) throw new Error("Failed to fetch today's logs")
    return await response.json()
  } catch (error) {
    console.error("Error fetching today's logs:", error)
    return {
      logs: [],
      total: 0,
      date: new Date().toISOString().split("T")[0],
    }
  }
}

async function getCrawlerStats() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/crawler?limit=5`, {
      cache: "no-store",
    })
    if (!response.ok) throw new Error("Failed to fetch crawler stats")
    return await response.json()
  } catch (error) {
    console.error("Error fetching crawler stats:", error)
    return {
      crawls: [],
      totalCrawls: 0,
      activeCrawls: 0,
      totalStorage: "0 GB",
    }
  }
}

export default async function DashboardPage() {
  const stats = await getStats()
  const todayLogsData = await getTodayLogs()
  const crawlerData = await getCrawlerStats()

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PAILAB Dashboard</h1>
          <p className="text-muted-foreground">System statistics & activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Users" value={stats.totalUsers} icon={Users} description="Registered users" />
          <StatCard
            title="Total Bugs"
            value={stats.totalBugs}
            icon={Bug}
            description={`${stats.recentBugs} in last 7 days`}
          />
          <StatCard
            title="Log Entries"
            value={stats.totalLogEntries}
            icon={FileText}
            description="Total log documents"
          />
          <StatCard title="Active Users" value={stats.activeUsers} icon={Activity} description="Last 30 days" />
        </div>

        {/* Grid layout for Today's Logs and Crawler DB side by side */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Today's Logs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Today's Logs
                  </CardTitle>
                  <CardDescription>
                    {todayLogsData.total} {todayLogsData.total === 1 ? "entry" : "entries"} today ({todayLogsData.date})
                  </CardDescription>
                </div>
                <Link href="/dashboard/log">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {todayLogsData.logs.length > 0 ? (
                <div className="space-y-3">
                  {todayLogsData.logs.map((log: any, index: number) => (
                    <div key={index} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {log.userName}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{log.time}</span>
                      </div>
                      <p className="text-sm leading-relaxed line-clamp-2">{log.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No logs recorded today</p>
              )}
            </CardContent>
          </Card>

          {/* Crawler DB overview card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Crawler Database
                  </CardTitle>
                  <CardDescription>
                    {crawlerData.totalCrawls} total crawls • {crawlerData.totalStorage} storage
                  </CardDescription>
                </div>
                <Link href="/dashboard/crawler">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {crawlerData.crawls.length > 0 ? (
                <div className="space-y-3">
                  {crawlerData.crawls.map((crawl: any) => (
                    <div key={crawl._id} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              crawl.status === "Done"
                                ? "bg-green-500"
                                : crawl.status === "Working"
                                  ? "bg-blue-500"
                                  : "bg-red-500"
                            }`}
                          />
                          <Badge variant="outline" className="text-xs">
                            {crawl.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <HardDrive className="h-3 w-3" />
                          {crawl.formattedSize}
                        </div>
                      </div>
                      <p className="font-medium text-sm line-clamp-1">{crawl.keyword}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {crawl.requester} • {crawl.crawlType}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No crawler jobs found</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
