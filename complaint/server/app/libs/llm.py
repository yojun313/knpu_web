from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")   

def llm_generate(query):
    client = OpenAI(
        api_key="dummy-key",  # 로컬 서버면 보통 아무 문자열이나 OK
        base_url="http://localhost:9000/v1"
    )

    response = client.chat.completions.create(
        model="/models/openai__gpt-oss-20b",  # curl에서 쓰던 모델 그대로
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": query},
        ]
    )

    return response.choices[0].message.content