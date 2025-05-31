import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai("gpt-4o"),
    system: `당신은 고소장 작성을 도와주는 전문 법무 어시스턴트입니다. 
    
사용자와 대화하면서 다음 정보들을 체계적으로 수집해주세요:

1. 고소인 정보 (이름, 주소, 연락처, 주민등록번호)
2. 피고소인 정보 (이름, 주소, 기타 신상정보)
3. 사건 개요 (언제, 어디서, 무엇이 일어났는지)
4. 피해 내용 (구체적인 피해 사실)
5. 증거 자료 (증거물, 증인 등)
6. 적용 법조문 (관련 법률)
7. 처벌 요구사항

정보를 수집할 때는 친근하고 이해하기 쉽게 질문하되, 법적으로 정확한 정보를 얻을 수 있도록 도와주세요.
모든 필요한 정보가 수집되면 "정보 수집이 완료되었습니다. 고소장을 생성하시겠습니까?"라고 물어보세요.`,
    messages,
  })

  return result.toDataStreamResponse()
}
