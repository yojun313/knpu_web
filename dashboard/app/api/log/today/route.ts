import { NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"

export async function GET() {
  try {
    const logsCollection = await getCollection("user-logs")
    const usersCollection = await getCollection("users")

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0]

    // Get all logs
    const logs = await logsCollection.find({}).toArray()

    // Process logs to extract today's entries
    const todayLogs: any[] = []

    for (const log of logs) {
      // Check if today's date exists as a key in the log document
      if (log[today] && Array.isArray(log[today])) {
        const user = await usersCollection.findOne({ uid: log.uid })
        const userName = user?.name || "Unknown User"

        log[today].forEach((entry: any) => {
          if (entry.time && entry.message) {
            todayLogs.push({
              uid: log.uid,
              userName,
              time: entry.time,
              message: entry.message,
            })
          }
        })
      }
    }

    // Sort by time (most recent first)
    todayLogs.sort((a, b) => b.time.localeCompare(a.time))

    // Limit to 10 most recent logs
    const recentLogs = todayLogs.slice(0, 10)

    return NextResponse.json({
      logs: recentLogs,
      total: todayLogs.length,
      date: today,
    })
  } catch (error) {
    console.error("Today's logs fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch today's logs" }, { status: 500 })
  }
}
