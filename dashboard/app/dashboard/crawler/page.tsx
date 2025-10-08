"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Database, Activity, HardDrive, Calendar, User, Zap, BarChart3 } from "lucide-react"

interface CrawlerData {
  _id: string
  uid: string
  name: string
  crawlType: string
  startDate: string
  endDate: string
  crawlOption: string
  crawlSpeed: string
  requester: string
  keyword: string
  crawlCom: string
  startTime: string
  endTime: string
  dbSize: number
  formattedSize: string
  status: "Done" | "Working" | "Error"
  datainfo: {
    totalArticleCnt?: number
    totalReplyCnt?: number
    totalRereplyyCnt?: number
  }
}

export default function CrawlerPage() {
  const [crawlerData, setCrawlerData] = useState<CrawlerData[]>([])
  const [loading, setLoading] = useState(true)
  const [fullStorage, setFullStorage] = useState(0)
  const [activeCrawl, setActiveCrawl] = useState(0)
  const [sortBy, setSortBy] = useState("starttime")
  const [mineOnly, setMineOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        sortBy,
        mine: mineOnly ? "1" : "0",
        userUid: "",
        search: searchQuery,
      })

      const response = await fetch(`/api/crawler?${params}`)
      const data = await response.json()

      if (data.success) {
        setCrawlerData(data.data)
        setFullStorage(data.fullStorage)
        setActiveCrawl(data.activeCrawl)
      }
    } catch (error) {
      console.error("Failed to fetch crawler data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [sortBy, mineOnly])

  const handleSearch = () => {
    fetchData()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Working":
        return "text-blue-500"
      case "Error":
        return "text-red-500"
      case "Done":
        return "text-green-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Working":
        return "default"
      case "Error":
        return "destructive"
      case "Done":
        return "secondary"
      default:
        return "outline"
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "크롤링 중" || dateStr === "오류 중단") {
      return dateStr
    }
    try {
      return new Date(dateStr).toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Crawler Database</h1>
            <p className="text-muted-foreground mt-2">Loading crawler data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Crawler Database</h1>
            <p className="text-muted-foreground mt-2">Monitor and manage web crawler jobs</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Crawls</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{crawlerData.length}</div>
              <p className="text-xs text-muted-foreground mt-1">All crawler jobs</p>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Crawls</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-blue-500">{activeCrawl}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently running</p>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Storage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{fullStorage.toFixed(2)} GB</div>
              <p className="text-xs text-muted-foreground mt-1">Data collected</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/40">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by keyword, name, or requester..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} size="icon" variant="secondary">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 min-w-[160px]">
                <label className="text-sm font-medium">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starttime">Start Time</SelectItem>
                    <SelectItem value="keyword">Keyword</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 min-w-[160px]">
                <label className="text-sm font-medium">Filter</label>
                <Select value={mineOnly ? "mine" : "all"} onValueChange={(v) => setMineOnly(v === "mine")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Crawls</SelectItem>
                    <SelectItem value="mine">My Crawls</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Crawler Jobs</CardTitle>
                <CardDescription className="mt-1.5">Showing {crawlerData.length} crawler jobs</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {crawlerData.map((crawl) => (
                <div
                  key={crawl._id}
                  className="group relative rounded-lg border border-border/40 bg-card p-4 transition-colors hover:border-border hover:bg-accent/5"
                >
                  <div className="space-y-3">
                    {/* Header Row with Status */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`h-2 w-2 rounded-full ${crawl.status === "Working" ? "bg-blue-500" : crawl.status === "Done" ? "bg-green-500" : "bg-red-500"}`}
                          />
                          <Badge variant={getStatusBadgeVariant(crawl.status)} className="font-medium">
                            {crawl.status}
                          </Badge>
                          <Badge variant="outline" className="font-mono text-xs">
                            {crawl.crawlType}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold tracking-tight truncate">{crawl.keyword}</h3>
                        <p className="text-sm text-muted-foreground mt-1 font-mono truncate">{crawl.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xl font-bold tracking-tight">{crawl.formattedSize}</div>
                        <p className="text-xs text-muted-foreground mt-1">Storage used</p>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm border-t border-border/40 pt-3">
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Start Time</p>
                          <p className="font-medium mt-0.5 truncate">{formatDate(crawl.startTime)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">End Time</p>
                          <p className="font-medium mt-0.5 truncate">{formatDate(crawl.endTime)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Requester</p>
                          <p className="font-medium mt-0.5 truncate">{crawl.requester}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Zap className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Speed / Option</p>
                          <p className="font-medium mt-0.5">
                            {crawl.crawlSpeed} / {crawl.crawlOption}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Data Info Stats */}
                    {crawl.datainfo && Object.keys(crawl.datainfo).length > 0 && (
                      <div className="flex items-center gap-6 text-sm border-t border-border/40 pt-3">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Data Collected:</span>
                        </div>
                        {crawl.datainfo.totalArticleCnt !== undefined && (
                          <div>
                            <span className="text-xs text-muted-foreground">Articles </span>
                            <span className="font-semibold">{crawl.datainfo.totalArticleCnt.toLocaleString()}</span>
                          </div>
                        )}
                        {crawl.datainfo.totalReplyCnt !== undefined && (
                          <div>
                            <span className="text-xs text-muted-foreground">Replies </span>
                            <span className="font-semibold">{crawl.datainfo.totalReplyCnt.toLocaleString()}</span>
                          </div>
                        )}
                        {crawl.datainfo.totalRereplyyCnt !== undefined && (
                          <div>
                            <span className="text-xs text-muted-foreground">Re-replies </span>
                            <span className="font-semibold">{crawl.datainfo.totalRereplyyCnt.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {crawlerData.length === 0 && (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No crawler jobs found</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your filters or search query</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
