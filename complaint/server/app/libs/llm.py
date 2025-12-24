from openai import OpenAI
import os
from dotenv import load_dotenv
from app.libs.form import complaint_schema

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")   



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
        function_call={"name": "generate_complaint"}
    )

    msg = response.choices[0].message

    if not msg.function_call:
        raise RuntimeError("LLM did not return function_call")

    return msg.function_call.arguments 
