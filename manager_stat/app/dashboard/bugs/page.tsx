"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BugDetailDialog } from "@/components/bug-detail-dialog"
import { Search, Calendar, User, ChevronLeft, ChevronRight, Eye } from "lucide-react"

interface Bug {
  _id: string
  uid: string
  date: string
  time: string
  message: string
  datetime: string
}

export default function BugsPage() {
  const [bugs, setBugs] = useState<Bug[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUid, setSelectedUid] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    fetchBugs()
  }, [selectedUid, page])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users/list")
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const fetchBugs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      })
      if (selectedUid) params.append("uid", selectedUid)
      if (searchQuery) params.append("search", searchQuery)

      const response = await fetch(`/api/bugs?${params}`)
      const data = await response.json()
      setBugs(data.bugs || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error("Failed to fetch bugs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchBugs()
  }

  const handleReset = () => {
    setSelectedUid("")
    setSearchQuery("")
    setPage(1)
  }

  const handleViewBug = (bugId: string) => {
    setSelectedBugId(bugId)
    setDialogOpen(true)
  }

  const getUserName = (uid: string) => {
    const user = users.find((u) => u.uid === uid)
    return user?.name || uid
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bug Reports</h1>
          <p className="text-muted-foreground">View and manage reported bugs</p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter bugs by user, version, or search in title and description</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="user-select">User</Label>
                <Select value={selectedUid} onValueChange={setSelectedUid}>
                  <SelectTrigger id="user-select">
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.uid} value={user.uid}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search-input">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search-input"
                    placeholder="Search in messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={handleSearch} size="sm">
                Apply Filters
              </Button>
              <Button onClick={handleReset} variant="outline" size="sm">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bugs List */}
        <Card>
          <CardHeader>
            <CardTitle>Bug Reports</CardTitle>
            <CardDescription>
              Showing {bugs.length} {bugs.length === 1 ? "report" : "reports"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading bugs...</p>
              </div>
            ) : bugs.length > 0 ? (
              <div className="space-y-3">
                {bugs.map((bug) => (
                  <div key={bug._id} className="rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="gap-1">
                            <User className="h-3 w-3" />
                            {getUserName(bug.uid)}
                          </Badge>
                          <Badge variant="secondary" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(bug.datetime).toLocaleString()}
                          </Badge>
                        </div>
                        <p className="text-sm leading-relaxed line-clamp-3">{bug.message}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleViewBug(bug._id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No bugs found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BugDetailDialog bugId={selectedBugId} open={dialogOpen} onOpenChange={setDialogOpen} />
    </DashboardLayout>
  )
}
