import { NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"

export async function GET() {
  try {
    const usersCollection = await getCollection("users")
    const users = await usersCollection.find({}).project({ uid: 1, name: 1, email: 1 }).toArray()

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Users list error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
