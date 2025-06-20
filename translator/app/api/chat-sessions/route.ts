import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/mongodb"
import GeneralChat from "@/lib/models/GeneralChat"
import Chat from "@/lib/models/Chat"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any

    await connectDB()

    // Get general chat sessions
    const generalChats = await GeneralChat.find({ userId: decoded.userId })
      .sort({ updatedAt: -1 })
      .select("_id title messages updatedAt")
      .lean()

    // Get translation chat sessions
    const translationChats = await Chat.find({ userId: decoded.userId })
      .sort({ updatedAt: -1 })
      .select("_id title messages updatedAt")
      .lean()

    // Format and combine sessions
    const sessions = [
      ...generalChats.map((chat) => ({
        _id: chat._id.toString(),
        title: chat.title || "새 일반 채팅",
        type: "general" as const,
        lastMessage:
          chat.messages?.length > 0 ? chat.messages[chat.messages.length - 1].content.slice(0, 50) + "..." : "",
        updatedAt: chat.updatedAt.toISOString(),
        messageCount: chat.messages?.length || 0,
      })),
      ...translationChats.map((chat) => ({
        _id: chat._id.toString(),
        title: chat.title || "새 번역 채팅",
        type: "translation" as const,
        lastMessage:
          chat.messages?.length > 0 ? chat.messages[chat.messages.length - 1].content.slice(0, 50) + "..." : "",
        updatedAt: chat.updatedAt.toISOString(),
        messageCount: chat.messages?.length || 0,
      })),
    ]

    // Sort by updatedAt
    sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return NextResponse.json(sessions)
  } catch (error) {
    console.error("Chat sessions error:", error)
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
