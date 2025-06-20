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
    const { message, userId, chatId, chatHistory, model, files } = await request.json()

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

    // Build conversation context with enhanced file processing
    let userContent = message
    if (files && files.length > 0) {
      const fileContents = files
        .map((file: any) => {
          if (file.type.startsWith("image/")) {
            return `\n\n📷 이미지 파일: ${file.name}\n이미지를 분석해주세요:\n${file.content}`
          } else if (file.type === "application/pdf") {
            return `\n\n📄 PDF 파일: ${file.name}\nPDF 내용을 분석하고 요약해주세요. 텍스트, 이미지, 그래프가 모두 포함되어 있을 수 있습니다:\n${file.content}`
          } else {
            return `\n\n📎 파일: ${file.name}\n${file.content}`
          }
        })
        .join("")
      userContent += fileContents
    }

    const messages = [
      {
        role: "system" as const,
        content: `당신은 도움이 되고 친근한 AI 어시스턴트입니다. 사용자의 질문에 정확하고 유용한 답변을 제공해주세요. 

🔍 **파일 분석 능력:**
- 이미지: 이미지의 내용을 자세히 분석하고 설명해주세요
- PDF: 문서의 내용을 요약하고 주요 포인트를 추출해주세요
- 텍스트: 내용을 분석하고 관련 질문에 답변해주세요

📋 **응답 규칙:**
- 한국어로 대화하며, 필요시 다른 언어도 사용할 수 있습니다
- 전문적이면서도 이해하기 쉽게 설명해주세요
- 파일이 첨부된 경우 해당 파일의 내용을 중심으로 답변해주세요`,
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
    })

    // Generate title for new chat
    let chatTitle = "새 일반 채팅"
    if (!chatId && message.length > 0) {
      chatTitle = message.slice(0, 30) + (message.length > 30 ? "..." : "")
    }

    // Create or update chat
    let currentChatId = chatId
    if (!chatId) {
      const newChat = await GeneralChat.create({
        userId: decoded.userId,
        title: chatTitle,
        messages: [{ role: "user", content: message, timestamp: new Date(), files }],
      })
      currentChatId = newChat._id.toString()
    } else {
      await GeneralChat.findByIdAndUpdate(chatId, {
        $push: {
          messages: { role: "user", content: message, timestamp: new Date(), files },
        },
        updatedAt: new Date(),
      })
    }

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = ""

          for await (const delta of result.textStream) {
            fullResponse += delta
            const chunk = encoder.encode(`data: ${JSON.stringify({ content: delta, chatId: currentChatId })}\n\n`)
            controller.enqueue(chunk)
          }

          // Save assistant response
          await GeneralChat.findByIdAndUpdate(currentChatId, {
            $push: {
              messages: {
                role: "assistant",
                content: fullResponse,
                timestamp: new Date(),
              },
            },
            updatedAt: new Date(),
          })

          const doneChunk = encoder.encode(`data: [DONE]\n\n`)
          controller.enqueue(doneChunk)
          controller.close()
        } catch (error) {
          console.error("Streaming error:", error)
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
