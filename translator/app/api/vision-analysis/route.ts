import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/mongodb"
import User from "@/lib/models/User"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any
    const { imageData, prompt, model } = await request.json()

    await connectDB()

    // 사용자의 OpenAI API 키 가져오기
    const user = await User.findById(decoded.userId)
    if (!user || !user.openaiApiKey) {
      return NextResponse.json({ message: "OpenAI API 키가 설정되지 않았습니다." }, { status: 400 })
    }

    // 공식 OpenAI SDK 사용
    const openai = new OpenAI({
      apiKey: user.openaiApiKey,
    })

    // Vision API 호출
    const response = await openai.chat.completions.create({
      model: model || "gpt-4o", // Vision 지원 모델
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt || "이 이미지를 자세히 분석해주세요. 텍스트가 있다면 추출하고, 그래프나 차트가 있다면 설명해주세요.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageData, // base64 데이터 URL
                detail: "high", // 고해상도 분석
              },
            },
          ],
        },
      ],
      max_tokens: 4000,
      temperature: 0.1,
    })

    return NextResponse.json({
      analysis: response.choices[0]?.message?.content || "분석 결과를 가져올 수 없습니다.",
      usage: response.usage,
    })
  } catch (error) {
    console.error("Vision analysis error:", error)
    return NextResponse.json({ message: "이미지 분석 중 오류가 발생했습니다." }, { status: 500 })
  }
}
