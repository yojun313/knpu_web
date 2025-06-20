import { type NextRequest, NextResponse } from "next/server"
import { streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/mongodb"
import Translation from "@/lib/models/Translation"
import User from "@/lib/models/User"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any
    const formData = await request.formData()
    const pdfFile = formData.get("pdf") as File

    if (!pdfFile) {
      return NextResponse.json({ message: "PDF 파일이 필요합니다." }, { status: 400 })
    }

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

    // Enhanced PDF processing
    const pdfBuffer = await pdfFile.arrayBuffer()
    const base64PDF = Buffer.from(pdfBuffer).toString("base64")

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullTranslation = ""

          // Enhanced prompt for better PDF processing
          const result = await streamText({
            model: openai(user.preferredModel || "gpt-4o"),
            messages: [
              {
                role: "system",
                content: `당신은 전문적인 학술 논문 번역가입니다. PDF 문서를 분석하고 번역할 때 다음 규칙을 따라주세요:

📋 **번역 규칙:**
1. 학술적이고 정확한 번역을 제공합니다
2. 전문 용어는 적절한 한국어 학술 용어로 번역합니다
3. 원문의 의미와 뉘앙스를 정확히 전달합니다
4. 번역이 어려운 전문 용어는 괄호 안에 원문을 병기합니다
5. 자연스러운 한국어로 번역하되 학술적 문체를 유지합니다

🔍 **PDF 분석 규칙:**
6. 텍스트뿐만 아니라 이미지, 그래프, 표, 수식도 분석해주세요
7. 그래프나 차트가 있다면 해당 내용을 설명해주세요
8. 수식이나 기호는 LaTeX 형태로 표현하거나 한글로 설명해주세요
9. 이미지나 다이어그램의 내용도 텍스트로 설명해주세요
10. 참고문헌과 인용은 원문 그대로 유지합니다

📄 **구조 유지:**
11. 논문의 구조(제목, 초록, 서론, 본문, 결론 등)를 유지합니다
12. 섹션 번호와 제목을 명확히 구분해주세요
13. 표나 그래프의 캡션도 번역해주세요

다음 PDF 논문을 위 규칙에 따라 완전히 번역해주세요:`,
              },
              {
                role: "user",
                content: `PDF 파일을 분석하고 번역해주세요. 

파일명: ${pdfFile.name}
파일 크기: ${(pdfFile.size / 1024 / 1024).toFixed(2)}MB

PDF 내용을 텍스트로 추출하고, 이미지나 그래프가 있다면 해당 내용도 분석해서 설명해주세요. 수식이나 특수 기호도 적절히 처리해주세요.

Base64 PDF 데이터: data:application/pdf;base64,${base64PDF.slice(0, 100000)}...

전체 논문을 완전히 번역해주세요.`,
              },
            ],
            temperature: 0.1, // 더 일관된 번역을 위해 낮은 temperature
            // 토큰 제한 완전 제거
          })

          let chunkCount = 0
          const totalEstimatedChunks = Math.ceil(pdfFile.size / (1024 * 50)) // Rough estimation

          // 번역 결과를 스트리밍
          for await (const delta of result.textStream) {
            fullTranslation += delta
            chunkCount++

            const progress = Math.min(25 + Math.round((chunkCount / totalEstimatedChunks) * 70), 95)

            const chunkData = encoder.encode(
              `data: ${JSON.stringify({
                content: delta,
                progress: progress,
              })}\n\n`,
            )
            controller.enqueue(chunkData)
          }

          // Save translation to database
          await Translation.create({
            userId: decoded.userId,
            originalFileName: pdfFile.name,
            originalText: `PDF 파일 (${(pdfFile.size / 1024 / 1024).toFixed(2)}MB)`,
            translatedText: fullTranslation,
            language: "ko",
          })

          // Final progress update
          const finalChunk = encoder.encode(
            `data: ${JSON.stringify({
              content: "",
              progress: 100,
            })}\n\n`,
          )
          controller.enqueue(finalChunk)

          const doneChunk = encoder.encode(`data: [DONE]\n\n`)
          controller.enqueue(doneChunk)
          controller.close()
        } catch (error) {
          console.error("Translation streaming error:", error)
          // 에러가 발생해도 부분 번역이라도 제공
          const errorChunk = encoder.encode(
            `data: ${JSON.stringify({
              content: "\n\n[번역 중 오류가 발생했지만 가능한 부분까지 번역을 완료했습니다.]",
              progress: 100,
            })}\n\n`,
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
    console.error("PDF translation error:", error)
    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
