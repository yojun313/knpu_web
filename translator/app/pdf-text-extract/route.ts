import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

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

    // Enhanced PDF text extraction
    const extractedText = await extractTextFromPDF(pdfFile)

    return NextResponse.json({
      text: extractedText,
      fileName: pdfFile.name,
      fileSize: pdfFile.size,
      pages: extractedText.split('\n\n').length, // 대략적인 페이지 수
    })
  } catch (error) {
    console.error("PDF extraction error:", error)
    return NextResponse.json({ message: "PDF 텍스트 추출 중 오류가 발생했습니다." }, { status: 500 })
  }
}

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // PDF.js를 사용한 텍스트 추출 (브라우저 환경에서는 다른 방법 필요)
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // 간단한 텍스트 추출 로직 (실제로는 pdf-parse 등 사용)
    const decoder = new TextDecoder('utf-8', { ignoreBOM: true })
    let text = decoder.decode(uint8Array)
    
    // PDF 구조에서 텍스트 부분만 추출하는 정규식
    const textMatches = text.match(/BT\s+.*?ET/gs) || []
    const extractedTexts = textMatches.map(match => {
      // PDF 텍스트 명령어에서 실제 텍스트만 추출
      const textContent = match.match(/$$(.*?)$$/g) || []
      return textContent.map(t => t.slice(1, -1)).join(' ')
    })
    
    let cleanText = extractedTexts.join('\n\n')
    
    // 텍스트 정제
    cleanText = cleanText
      .replace(/\s+/g, ' ') // 여러 공백을 하나로
      .replace(/\n\s*\n/g, '\n\n') // 빈 줄 정리
      .trim()
    
    return cleanText || "PDF에서 텍스트를 추출할 수 없습니다. 이미지 기반 PDF이거나 보호된 파일일 수 있습니다."
  } catch (error) {
    console.error("PDF text extraction error:", error)
    return "PDF 텍스트 추출 중 오류가 발생했습니다."
  }
}
