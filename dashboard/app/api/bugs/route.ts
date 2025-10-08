import { NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const bugsCollection = await getCollection("user-bugs")

    const query: any = {}
    if (uid) {
      query.uid = uid
    }

    // Get all bugs
    const skip = (page - 1) * limit
    const bugs = await bugsCollection.find(query).skip(skip).limit(limit).toArray()

    const transformedBugs = bugs.flatMap((bug) => {
      const entries: any[] = []

      // Iterate through all keys in the bug document
      Object.keys(bug).forEach((key) => {
        // Check if key is a date (YYYY-MM-DD format)
        if (/^\d{4}-\d{2}-\d{2}$/.test(key) && Array.isArray(bug[key])) {
          // Each date has an array of log entries
          bug[key].forEach((entry: any, index: number) => {
            entries.push({
              _id: `${bug._id.toString()}-${key}-${index}`,
              uid: bug.uid,
              date: key,
              time: entry.time,
              message: entry.message,
              datetime: `${key}T${entry.time}`,
            })
          })
        }
      })

      return entries
    })

    let filteredBugs = transformedBugs
    if (search) {
      filteredBugs = transformedBugs.filter((bug) => bug.message.toLowerCase().includes(search.toLowerCase()))
    }

    filteredBugs.sort((a, b) => {
      const dateA = new Date(a.datetime)
      const dateB = new Date(b.datetime)
      return dateB.getTime() - dateA.getTime()
    })

    const paginatedBugs = filteredBugs.slice(skip, skip + limit)
    const total = filteredBugs.length

    return NextResponse.json({
      bugs: paginatedBugs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Bugs fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch bugs" }, { status: 500 })
  }
}
