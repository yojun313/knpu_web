"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, User, FileText } from "lucide-react"

interface BugDetailDialogProps {
  bugId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface BugDetail {
  _id: string
  uid: string
  date: string
  time: string
  message: string
  datetime: string
}

export function BugDetailDialog({ bugId, open, onOpenChange }: BugDetailDialogProps) {
  const [bug, setBug] = useState<BugDetail | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (bugId && open) {
      fetchBugDetail()
    }
  }, [bugId, open])

  const fetchBugDetail = async () => {
    if (!bugId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/bugs/${bugId}`)
      const data = await response.json()
      setBug(data.bug)

      // Fetch user name
      if (data.bug?.uid) {
        const usersResponse = await fetch("/api/users/list")
        const usersData = await usersResponse.json()
        const user = usersData.users?.find((u: any) => u.uid === data.bug.uid)
        setUserName(user?.name || data.bug.uid)
      }
    } catch (error) {
      console.error("Failed to fetch bug detail:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Bug Report Details</DialogTitle>
          <DialogDescription>Complete information about the reported bug</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading bug details...</p>
          </div>
        ) : bug ? (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Header Info */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <User className="h-3 w-3" />
                    {userName}
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(bug.datetime).toLocaleString()}
                  </Badge>
                </div>
              </div>

              {/* Bug Message */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-semibold">Error Message</h4>
                </div>
                <pre className="text-xs leading-relaxed whitespace-pre-wrap rounded-lg bg-muted p-4 font-mono overflow-x-auto">
                  {bug.message}
                </pre>
              </div>

              {/* User ID */}
              <div className="text-sm">
                <p className="text-muted-foreground">User ID</p>
                <p className="font-mono text-xs">{bug.uid}</p>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Bug not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
