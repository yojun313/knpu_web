from fastapi import APIRouter, Body
from app.libs.llm import llm_generate
from app.libs.form import make_query, safe_json_load
from app.libs.exceptions import UnprocessableEntityException
from app.libs.docx import word_generate
from app.libs.pdf import convert_to_pdf
import os
import json
import logging
import traceback

LOG_DIR = os.path.join(os.path.dirname(__file__), '..', "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "generate_errors.log")

api_key = os.getenv("OPENAI_API_KEY")

router = APIRouter()

logging.basicConfig(
    filename=LOG_FILE,
    level=logging.ERROR,
    format="%(asctime)s | %(levelname)s | %(message)s",
)

@router.post("/generate")
def generate_complaints(payload: dict = Body(...)):
    llm_result = None
    try:
        combined = payload["combined_data"]
        
        form_data = {}
        for section in combined.values():
            if isinstance(section, dict):
                for k, v in section.items():
                    if isinstance(v, str):
                        form_data[k] = v.replace("\t", " ").replace("\r", " ").replace("\n", " ")
                    else:
                        form_data[k] = v
        
        llm_result, model_name = llm_generate(make_query(form_data))
        try:
            result_data = safe_json_load(llm_result)
        except:
            raise UnprocessableEntityException("LLM response is not a valid JSON")
        
        
        docx_path = word_generate(result_data)
        pdf_path = convert_to_pdf(docx_path)

        return {
            "file_id": docx_path.stem,
            "preview_pdf": f"/preview/pdf/{docx_path.stem}",
            "download_word": f"/download/word/{docx_path.stem}",
            "download_pdf": f"/download/pdf/{docx_path.stem}",
            "model_name": model_name,
            "model_url": f"https://huggingface.co/{model_name}"
        }
    except Exception as e:
        logging.error(
            (
                "Exception occurred\n"
                f"Exception: {str(e)}\n\n"
                "LLM Response:\n"
                f"{result_data}\n\n"
                "Traceback:\n"
                f"{traceback.format_exc()}"
            )
        )

        raise UnprocessableEntityException(str(e))