import { type NextRequest, NextResponse } from "next/server"
import { streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/mongodb"
import User from "@/lib/models/User"
import GeneralChat from "@/lib/models/GeneralChat"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any
    const { message, userId, chatHistory, model, files } = await request.json()

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

    // Build conversation context with files
    let userContent = message
    if (files && files.length > 0) {
      const fileContents = files.map((file: any) => `\n\n파일: ${file.name}\n${file.content}`).join("")
      userContent += fileContents
    }

    const messages = [
      {
        role: "system" as const,
        content: `당신은 도움이 되고 친근한 AI 어시스턴트입니다. 사용자의 질문에 정확하고 유용한 답변을 제공해주세요. 한국어로 대화하며, 필요시 다른 언어도 사용할 수 있습니다. 

사용자가 파일을 업로드한 경우, 파일의 내용을 분석하고 관련된 질문에 답변해주세요. 이미지 파일의 경우 이미지를 설명하고 분석해주세요.`,
      },
      ...chatHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: userContent,
      },
    ]

    const result = await streamText({
      model: openai(model || "gpt-4o"),
      messages,
      temperature: 0.7,
      // 토큰 제한 제거 - 무제한 생성
    })

    // Save chat to database
    await GeneralChat.create({
      userId: decoded.userId,
      messages: [...chatHistory, { role: "user", content: message, timestamp: new Date(), files }],
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
          await GeneralChat.findOneAndUpdate(
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
          // 에러가 발생해도 스트림을 계속 유지
          const errorChunk = encoder.encode(
            `data: ${JSON.stringify({ content: "\n\n죄송합니다. 응답 중 오류가 발생했지만 계속 진행하겠습니다." })}\n\n`,
          )
          controller.enqueue(errorChunk)
          const doneChunk = encoder.encode(`data: [DONE]\n\n`)
          controller.enqueue(doneChunk)
          controller.close()
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
    console.error("General chat API error:", error)
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
