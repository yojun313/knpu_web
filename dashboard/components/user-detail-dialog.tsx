"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Mail, Smartphone, Calendar } from "lucide-react"

interface UserDetailDialogProps {
  uid: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface UserDetail {
  _id: string
  uid: string
  name: string
  email: string
  pushoverKey?: string
  device_list?: string[]
}

interface UserStats {
  logCount: number
  bugCount: number
  recentLogDates: string[]
}

interface RecentBug {
  _id: string
  bugTitle: string
  versionName: string
  datetime: string
}

export function UserDetailDialog({ uid, open, onOpenChange }: UserDetailDialogProps) {
  const [user, setUser] = useState<UserDetail | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentBugs, setRecentBugs] = useState<RecentBug[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (uid && open) {
      fetchUserDetail()
    }
  }, [uid, open])

  const fetchUserDetail = async () => {
    if (!uid) return
    setLoading(true)
    try {
      const response = await fetch(`/api/users/${uid}`)
      const data = await response.json()
      setUser(data.user)
      setStats(data.stats)
      setRecentBugs(data.recentBugs || [])
    } catch (error) {
      console.error("Failed to fetch user detail:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>Complete information about the user and their activity</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading user details...</p>
          </div>
        ) : user && stats ? (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* User Info */}
              <div className="space-y-3">
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">User ID:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{user.uid}</code>
                  </div>
                  {user.pushoverKey && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Pushover Key:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{user.pushoverKey}</code>
                    </div>
                  )}
                </div>
              </div>

              {/* Devices */}
              {user.device_list && user.device_list.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-semibold">Registered Devices</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.device_list.map((device, index) => (
                        <Badge key={index} variant="secondary">
                          {device}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Recent Bugs */}
              {recentBugs.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-semibold">Recent Bug Reports</h4>
                    <div className="space-y-2">
                      {recentBugs.map((bug) => (
                        <div key={bug._id} className="rounded-lg border p-3 text-sm">
                          <div className="font-medium">{bug.bugTitle}</div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {bug.versionName}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(bug.datetime).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">User not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
