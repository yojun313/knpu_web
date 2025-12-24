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

    models = client.models.list()
    model_objs = getattr(models, "data", models) or []
    if not model_objs:
        raise RuntimeError("No models available from local server")
    first = model_objs[0]
    model_id = getattr(first, "id", first)

    response = client.chat.completions.create(
        model=model_id,
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": query},
        ]
    )

    return response.choices[0].message.content