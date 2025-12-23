from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")   

def llm_generate(query):
    client = OpenAI(api_key = api_key)
    model = "gpt-4"
    response = client.chat.completions.create(
        model = model,
        messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": query},
            ]
    )

    content = response.choices[0].message.content
    return content