import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/mongodb"
import Chat from "@/lib/models/Chat"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    await connectDB()

    const latestChat = await Chat.findOne({ userId: decoded.userId }).sort({ createdAt: -1 }).limit(1)

    const messages = latestChat?.messages || []

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Chat history error:", error)
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
