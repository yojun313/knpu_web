import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // multipart/form-data 요청 처리
    const formData = await request.formData()
    const imageFile = formData.get("image") as File | null

    if (!imageFile) {
      return NextResponse.json({ error: "이미지 파일이 필요합니다" }, { status: 400 })
    }

    // 파일을 ArrayBuffer로 변환
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Base64로 인코딩
    const base64Image = buffer.toString("base64")
    const dataUrl = `data:${imageFile.type};base64,${base64Image}`

    // OpenAI API 호출 준비
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "이미지에 보이는 차량 번호판에 적힌 문자(숫자 및 글자)만 정확히 추출해 주세요. 다른 설명 없이 번호판의 문자만 출력해 주세요. 예: 12가3456",
          },
          {
            type: "image_url",
            image_url: {
              url: dataUrl,
            },
          },
        ],
      },
    ]

    // OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any, // TypeScript 타입 이슈 해결을 위한 타입 캐스팅
    })

    // 인식된 텍스트 추출
    const recognized = response.choices[0].message.content?.trim()

    // 응답 반환
    return NextResponse.json({ plate_text: recognized })
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      { error: `서버 오류: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}

// 파일 크기 제한 설정 (기본값: 4MB, 여기서는 10MB로 설정)
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
}
