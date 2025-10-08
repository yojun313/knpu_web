import { NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"

export async function GET() {
  try {
    const usersCollection = await getCollection("users")
    const bugsCollection = await getCollection("user-bugs")
    const logsCollection = await getCollection("user-logs")

    // Get total counts
    const totalUsers = await usersCollection.countDocuments()
    const totalLogEntries = await logsCollection.countDocuments()

    const allBugs = await bugsCollection.find({}).toArray()
    let totalBugs = 0
    let recentBugs = 0
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0]

    allBugs.forEach((bug) => {
      Object.keys(bug).forEach((key) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(key) && Array.isArray(bug[key])) {
          totalBugs += bug[key].length
          if (key >= sevenDaysAgoStr) {
            recentBugs += bug[key].length
          }
        }
      })
    })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0]

    const activeUsersSet = new Set<string>()
    const allLogs = await logsCollection.find({}).toArray()

    allLogs.forEach((log) => {
      Object.keys(log).forEach((key) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(key) && key >= thirtyDaysAgoStr) {
          activeUsersSet.add(log.uid)
        }
      })
    })

    return NextResponse.json({
      totalUsers,
      totalBugs,
      totalLogEntries,
      recentBugs,
      activeUsers: activeUsersSet.size,
      bugsByVersion: [], // Removed version grouping since structure doesn't have versionName
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
