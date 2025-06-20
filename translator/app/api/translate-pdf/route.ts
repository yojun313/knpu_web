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

    // Convert PDF to text (simplified - in production, use pdf-parse or similar)
    const pdfBuffer = await pdfFile.arrayBuffer()
    const pdfText = await extractTextFromPDF(pdfBuffer)

    if (!pdfText) {
      return NextResponse.json({ message: "PDF에서 텍스트를 추출할 수 없습니다." }, { status: 400 })
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

    // 긴 텍스트를 청크로 나누어 처리
    const chunks = splitTextIntoChunks(pdfText, 8000) // 더 큰 청크 사이즈

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullTranslation = ""
          let chunkIndex = 0

          for (const chunk of chunks) {
            chunkIndex++

            // 각 청크에 대해 번역 수행
            const result = await streamText({
              model: openai(user.preferredModel || "gpt-4o"),
              messages: [
                {
                  role: "system",
                  content: `당신은 전문적인 학술 논문 번역가입니다. 다음 규칙을 따라 영어 논문을 한국어로 번역해주세요:

1. 학술적이고 정확한 번역을 제공합니다
2. 전문 용어는 적절한 한국어 학술 용어로 번역합니다
3. 원문의 의미와 뉘앙스를 정확히 전달합니다
4. 번역이 어려운 전문 용어는 괄호 안에 원문을 병기합니다
5. 자연스러운 한국어로 번역하되 학술적 문체를 유지합니다
6. 논문의 구조(제목, 초록, 서론, 본문, 결론 등)를 유지합니다
7. 참고문헌과 인용은 원문 그대로 유지합니다
8. 이것은 전체 논문의 일부분입니다. 문맥을 고려하여 번역하되, 완전한 문장으로 번역해주세요.

${chunks.length > 1 ? `현재 ${chunkIndex}/${chunks.length} 번째 부분을 번역하고 있습니다.` : ""}

다음 텍스트를 번역해주세요:`,
                },
                {
                  role: "user",
                  content: chunk,
                },
              ],
              temperature: 0.1, // 더 일관된 번역을 위해 낮은 temperature
              // 토큰 제한 완전 제거
            })

            // 청크별 번역 결과를 스트리밍
            for await (const delta of result.textStream) {
              fullTranslation += delta
              const chunkData = encoder.encode(
                `data: ${JSON.stringify({
                  content: delta,
                  progress: Math.round((chunkIndex / chunks.length) * 100),
                })}\n\n`,
              )
              controller.enqueue(chunkData)
            }

            // 청크 간 구분을 위한 줄바꿈 추가
            if (chunkIndex < chunks.length) {
              fullTranslation += "\n\n"
              const separatorChunk = encoder.encode(`data: ${JSON.stringify({ content: "\n\n" })}\n\n`)
              controller.enqueue(separatorChunk)
            }
          }

          // Save translation to database
          await Translation.create({
            userId: decoded.userId,
            originalFileName: pdfFile.name,
            originalText: pdfText,
            translatedText: fullTranslation,
            language: "ko",
          })

          const doneChunk = encoder.encode(`data: [DONE]\n\n`)
          controller.enqueue(doneChunk)
          controller.close()
        } catch (error) {
          console.error("Translation streaming error:", error)
          // 에러가 발생해도 부분 번역이라도 제공
          const errorChunk = encoder.encode(
            `data: ${JSON.stringify({ content: "\n\n[번역 중 오류가 발생했지만 가능한 부분까지 번역을 완료했습니다.]" })}\n\n`,
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

// Simplified PDF text extraction (in production, use pdf-parse)
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  // This is a placeholder - in a real application, you would use pdf-parse
  // For now, we'll simulate text extraction
  const decoder = new TextDecoder()
  const text = decoder.decode(buffer)

  // Extract readable text (this is very simplified)
  const textMatch = text.match(/[A-Za-z\s.,;:!?()[\]{}'"0-9-]+/g)
  return textMatch ? textMatch.join(" ") : "PDF 텍스트 추출에 실패했습니다."
}

function splitTextIntoChunks(text: string, chunkSize: number): string[] {
  const chunks = []
  const sentences = text.split(/[.!?]+/)
  let currentChunk = ""

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk += sentence + ". "
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  return chunks.filter((chunk) => chunk.length > 0)
}
