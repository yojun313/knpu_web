import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/mongodb"
import GeneralChat from "@/lib/models/GeneralChat"

export async function GET(request: NextRequest, { params }: { params: { chatId: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any
    const { chatId } = params

    await connectDB()

    const chat = await GeneralChat.findOne({
      _id: chatId,
      userId: decoded.userId,
    })

    if (!chat) {
      return NextResponse.json({ message: "채팅을 찾을 수 없습니다." }, { status: 404 })
    }

    return NextResponse.json(chat.messages || [])
  } catch (error) {
    console.error("Chat history error:", error)
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
