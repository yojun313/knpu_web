import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function POST(req: Request) {
  const { collectedInfo } = await req.json()

  const result = await generateText({
    model: openai("gpt-4o"),
    system: `당신은 전문 법무사입니다. 수집된 정보를 바탕으로 대한민국 법원 양식에 맞는 정식 고소장을 작성해주세요.

고소장 양식 (정확한 형식):

고    소    장

수신: [관할 경찰서장 또는 검찰청]

1. 고소인
   성명: [이름]
   주민등록번호: [주민등록번호]
   주소: [주소]
   전화번호: [전화번호]

2. 피고소인(피의자)
   성명: [이름]
   주민등록번호: [주민등록번호 또는 미상]
   주소: [주소 또는 미상]

3. 고소의 취지
   피고소인을 [적용 법조문]으로 처벌하여 주시기 바랍니다.

4. 고소 이유
   [구체적인 사실관계를 시간순으로 기재]

5. 입증방법
   [증거자료 목록]

6. 첨부서류
   1. 증거자료 [개수]부
   2. 기타 관련 서류

위와 같이 고소하오니 수사하시어 엄중히 처벌하여 주시기 바랍니다.

[날짜]

고소인: [서명]

[관할기관명]`,
    prompt: `다음 정보를 바탕으로 고소장을 작성해주세요:\n\n${collectedInfo}`,
  })

  return Response.json({ complaint: result.text })
}
