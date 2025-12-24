from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")   

complaint_schema = {
    "name": "generate_complaint",
    "description": "고소장 정보를 생성한다",
    "parameters": {
        "type": "object",
        "properties": {
            "고소 죄명": {"type": "string"},
            "고소인 성명": {"type": "string"},
            "고소인 주민등록번호": {"type": "string"},
            "고소인 주소": {"type": "string"},
            "고소인 직업": {"type": "string"},
            "고소인 전화": {"type": "string"},
            "고소인 이메일": {"type": "string"},
            "피고소인 성명": {"type": "string"},
            "피고소인 주민등록번호": {"type": "string"},
            "피고소인 주소": {"type": "string"},
            "피고소인 직업": {"type": "string"},
            "피고소인 전화": {"type": "string"},
            "피고소인 이메일": {"type": "string"},
            "피고소인 기타사항": {"type": "string"},
            "고소 취지": {"type": "string"},
            "범죄 사실": {"type": "string"},
            "고소 이유": {"type": "string"},
            "증거 자료": {"type": "string"},
            "중복 고소 여부": {
                "type": "string",
                "enum": ["있음", "없음"]
            },
            "관련 형사사건 수사 유무": {
                "type": "string",
                "enum": ["있음", "없음"]
            },
            "기타": {"type": "string"},
            "고소일": {"type": "string"},
            "제출 경찰서": {"type": "string"}
        },
        "required": [
            "고소 죄명",
            "고소인 성명",
            "피고소인 기타사항",
            "고소 취지",
            "범죄 사실",
            "고소 이유",
            "중복 고소 여부",
            "관련 형사사건 수사 유무",
            "고소일",
            "제출 경찰서"
        ]
    }
}

def llm_generate(query):
    client = OpenAI(
        api_key="dummy-key",
        base_url="http://localhost:9000/v1"
    )

    models = client.models.list()
    model_objs = getattr(models, "data", models) or []
    if not model_objs:
        raise RuntimeError("No models available from local server")

    model_id = getattr(model_objs[0], "id", model_objs[0])

    response = client.chat.completions.create(
        model=model_id,
        messages=[
            {
                "role": "system",
                "content": (
                    "너는 고소장 자동 작성 시스템이다. "
                    "반드시 함수 호출 형식으로만 응답해야 한다."
                )
            },
            {"role": "user", "content": query},
        ],
        functions=[complaint_schema],
        function_call={"name": "generate_complaint"}  # 🔥 강제
    )

    msg = response.choices[0].message

    if not msg.function_call:
        raise RuntimeError("LLM did not return function_call")

    return msg.function_call.arguments  # 🔥 이미 JSON 문자열
