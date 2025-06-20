import { type NextRequest, NextResponse } from "next/server"
import { streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/mongodb"
import Chat from "@/lib/models/Chat"
import User from "@/lib/models/User"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any
    const { message, userId, chatHistory, model } = await request.json()

    await connectDB()

    // 사용자의 OpenAI API 키 가져오기
    const user = await User.findById(decoded.userId)
    if (!user || !user.openaiApiKey) {
      return NextResponse.json({ message: "OpenAI API 키가 설정되지 않았습니다." }, { status: 400 })
    }

    // 사용자의 API 키로 OpenAI 클라이언트 생성
    const openai = createOpenAI({
      apiKey: user.openaiApiKey,
    })

    // Build conversation context
    const messages = [
      {
        role: "system" as const,
        content: `당신은 전문적인 논문 번역가입니다. 다음 규칙을 따라주세요:
1. 학술적이고 정확한 번역을 제공합니다
2. 전문 용어는 적절한 한국어 학술 용어로 번역합니다
3. 원문의 의미와 뉘앙스를 정확히 전달합니다
4. 번역이 어려운 전문 용어는 괄호 안에 원문을 병기합니다
5. 자연스러운 한국어로 번역하되 학술적 문체를 유지합니다`,
      },
      ...chatHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: message,
      },
    ]

    const result = await streamText({
      model: openai(model || "gpt-4o"),
      messages,
      temperature: 0.3,
      // 토큰 제한 제거
    })

    // Save chat to database
    await Chat.create({
      userId: decoded.userId,
      messages: [...chatHistory, { role: "user", content: message, timestamp: new Date() }],
    })

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = ""

          for await (const delta of result.textStream) {
            fullResponse += delta
            const chunk = encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`)
            controller.enqueue(chunk)
          }

          // Save assistant response
          await Chat.findOneAndUpdate(
            { userId: decoded.userId },
            {
              $push: {
                messages: {
                  role: "assistant",
                  content: fullResponse,
                  timestamp: new Date(),
                },
              },
            },
            { sort: { createdAt: -1 } },
          )

          const doneChunk = encoder.encode(`data: [DONE]\n\n`)
          controller.enqueue(doneChunk)
          controller.close()
        } catch (error) {
          console.error("Streaming error:", error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
