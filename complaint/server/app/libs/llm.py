from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")   

def llm_generate(query):
    client = OpenAI(
        api_key="dummy-key",
        base_url="http://localhost:9000/v1"
    )
    print("쿼리 들어옴")
    models = client.models.list()
    model_objs = getattr(models, "data", models) or []
    if not model_objs:
        raise RuntimeError("No models available from local server")

    model_id = getattr(model_objs[0], "id", model_objs[0])

    print("쿼리 응답 시작")
    response = client.chat.completions.create(
        model=model_id,
        messages=[
            {
                "role": "system",
                "content": (
                    "너는 고소장 자동 작성 시스템이다.\n"
                    "반드시 아래 스키마에 맞는 JSON 객체만 출력하라.\n"
                    "설명, 문장, 코드블록(```), 주석을 절대 포함하지 마라.\n"
                    "출력은 { 로 시작해서 } 로 끝나야 한다."
                )
            },
            {"role": "user", "content": query},
        ],
        temperature=0
    )
    print("쿼리 응답 완료")
    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("LLM returned empty response")
    
    model_id = model_id.replace('/models/', '').replace('__', '/')

    return content, model_id