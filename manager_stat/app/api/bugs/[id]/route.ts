import { NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const parts = id.split("-")
    if (parts.length < 5) {
      return NextResponse.json({ error: "Invalid bug ID format" }, { status: 400 })
    }

    // Reconstruct MongoDB ObjectId (first part) and date (next 3 parts) and index (last part)
    const mongoId = parts[0]
    const date = `${parts[1]}-${parts[2]}-${parts[3]}`
    const index = Number.parseInt(parts[4])

    const bugsCollection = await getCollection("user-bugs")
    const bug = await bugsCollection.findOne({ _id: new ObjectId(mongoId) })

    if (!bug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 })
    }

    const dateEntries = bug[date]
    if (!dateEntries || !Array.isArray(dateEntries) || !dateEntries[index]) {
      return NextResponse.json({ error: "Bug entry not found" }, { status: 404 })
    }

    const entry = dateEntries[index]

    return NextResponse.json({
      bug: {
        _id: id,
        uid: bug.uid,
        date: date,
        time: entry.time,
        message: entry.message,
        datetime: `${date}T${entry.time}`,
      },
    })
  } catch (error) {
    console.error("Bug fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch bug" }, { status: 500 })
  }
}
