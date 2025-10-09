import { NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")
    const date = searchParams.get("date")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const logsCollection = await getCollection("user-logs")
    const usersCollection = await getCollection("users")

    // Build query
    const query: any = {}
    if (uid) {
      query.uid = uid
    }

    // Get logs with pagination
    const skip = (page - 1) * limit
    const logs = await logsCollection.find(query).sort({ _id: -1 }).skip(skip).limit(limit).toArray()

    // Get total count for pagination
    const total = await logsCollection.countDocuments(query)

    // Enrich logs with user names
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        const user = await usersCollection.findOne({ uid: log.uid })
        return {
          ...log,
          userName: user?.name || "Unknown User",
        }
      }),
    )

    // Process logs to extract date-based entries
    const processedLogs = enrichedLogs.flatMap((log) => {
      const entries: any[] = []
      Object.keys(log).forEach((key) => {
        // Check if key is a date (YYYY-MM-DD format)
        if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
          const dateEntries = log[key]
          if (Array.isArray(dateEntries)) {
            dateEntries.forEach((entry: any) => {
              if (entry.time && entry.message && log.userName !== "admin") {
                entries.push({
                  uid: log.uid,
                  userName: log.userName,
                  date: key,
                  time: entry.time,
                  message: entry.message,
                })
              }
            })
          }
        }
      })
      return entries
    })

    // Filter by date if specified
    const filteredLogs = date ? processedLogs.filter((entry) => entry.date === date) : processedLogs

    // Sort by date and time (most recent first)
    filteredLogs.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date)
      if (dateCompare !== 0) return dateCompare
      return b.time.localeCompare(a.time)
    })

    return NextResponse.json({
      logs: filteredLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Logs fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}
