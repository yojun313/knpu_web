import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/mongodb"
import User from "@/lib/models/User"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, openaiApiKey, preferredModel } = await request.json()

    if (!name || !email || !password || !openaiApiKey) {
      return NextResponse.json({ message: "모든 필드를 입력해주세요." }, { status: 400 })
    }

    // OpenAI API 키 유효성 검사
    if (!openaiApiKey.startsWith("sk-")) {
      return NextResponse.json({ message: "올바른 OpenAI API 키를 입력해주세요." }, { status: 400 })
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ message: "이미 존재하는 이메일입니다." }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with preferred model
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      openaiApiKey,
      preferredModel: preferredModel || "gpt-4o",
    })

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "7d",
    })

    return NextResponse.json({
      message: "회원가입이 완료되었습니다.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferredModel: user.preferredModel,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
