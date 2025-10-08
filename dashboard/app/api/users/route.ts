import { NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const usersCollection = await getCollection("users")
    const logsCollection = await getCollection("user-logs")
    const bugsCollection = await getCollection("user-bugs")

    // Build query
    const query: any = {}
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { uid: { $regex: search, $options: "i" } },
      ]
    }

    // Get users with pagination
    const skip = (page - 1) * limit
    const users = await usersCollection.find(query).skip(skip).limit(limit).toArray()

    // Get total count for pagination
    const total = await usersCollection.countDocuments(query)

    // Enrich users with activity stats
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const logCount = await logsCollection.countDocuments({ uid: user.uid })
        const bugCount = await bugsCollection.countDocuments({ uid: user.uid })

        return {
          ...user,
          _id: user._id?.toString(),
          logCount,
          bugCount,
        }
      }),
    )

    return NextResponse.json({
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Users fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
