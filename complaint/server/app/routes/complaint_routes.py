from fastapi import APIRouter, Body
from app.libs.llm import llm_generate
from app.libs.form import make_query
from app.libs.exceptions import UnprocessableEntityException
from app.libs.docx import word_generate
from app.libs.pdf import convert_to_pdf
import os
import json

api_key = os.getenv("OPENAI_API_KEY")

router = APIRouter()

@router.post("/generate")
def generate_complaints(payload: dict = Body(...)):
    combined = payload["combined_data"]

    form_data = {}
    for section in combined.values():
        if isinstance(section, dict):
            for k, v in section.items():
                if isinstance(v, str):
                    form_data[k] = v.replace("\t", " ").replace("\r", " ").replace("\n", " ")
                else:
                    form_data[k] = v
    
    llm_result = llm_generate(make_query(form_data))
    try:
        result_data = json.loads(llm_result)
    except:
        raise UnprocessableEntityException("LLM response is not a valid JSON")
    
    
    docx_path = word_generate(result_data)
    pdf_path = convert_to_pdf(docx_path)

    return {
        "file_id": docx_path.stem,
        "preview_pdf": f"/preview/pdf/{docx_path.stem}",
        "download_word": f"/download/word/{docx_path.stem}",
        "download_pdf": f"/download/pdf/{docx_path.stem}",
    }