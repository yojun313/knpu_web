import { NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"

export async function GET(request: Request, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const { uid } = await params
    const usersCollection = await getCollection("users")
    const logsCollection = await getCollection("user-logs")
    const bugsCollection = await getCollection("user-bugs")

    const user = await usersCollection.findOne({ uid })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get activity stats
    const logCount = await logsCollection.countDocuments({ uid })
    const bugCount = await bugsCollection.countDocuments({ uid })

    // Get recent bugs
    const recentBugs = await bugsCollection.find({ uid }).sort({ datetime: -1 }).limit(5).toArray()

    // Get log entries count by date (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const userLogs = await logsCollection.findOne({ uid })
    let recentLogDates: string[] = []
    if (userLogs) {
      recentLogDates = Object.keys(userLogs)
        .filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key))
        .filter((date) => new Date(date) >= thirtyDaysAgo)
        .sort()
        .reverse()
    }

    return NextResponse.json({
      user: {
        ...user,
        _id: user._id?.toString(),
      },
      stats: {
        logCount,
        bugCount,
        recentLogDates,
      },
      recentBugs: recentBugs.map((bug) => ({
        ...bug,
        _id: bug._id.toString(),
      })),
    })
  } catch (error) {
    console.error("User fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
