import os
from typing import Optional, List, Dict, Any
import base64
import io
import json

from pydantic import BaseModel
from pypdf import PdfReader
import google.generativeai as genai
from dotenv import load_dotenv
from PIL import Image

load_dotenv()
# from google import genai
# from google.genai import types
from io import BytesIO

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
print("Using GEMINI_API_KEY:", "set" if GEMINI_API_KEY else "missing")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is not set")

genai.configure(api_key=GEMINI_API_KEY)

text_model = genai.GenerativeModel("gemini-2.5-flash")
image_model = genai.GenerativeModel("gemini-2.5-flash-image")

hashtags = [  
    "verkehr",
    "wohnen",
    "stadtplanung",
    "umwelt",
    "soziales",
    "bildung",
    "kultur",
    "finanzen",
    "sicherheit",
    "verwaltung",
]

class RequestVariables(BaseModel):
    pdf_base64: str
    pdf_filename: Optional[str] = "document.pdf"
    max_chars: Optional[int] = 25000
    max_output_length: Optional[int] = 1000

class GlossaryEntry(BaseModel):
    term: str
    description: str


class ResponseVariables(BaseModel):
    pdf_filename: str
    summary: str
    glossary: List[GlossaryEntry] = []


def _strip_markdown_block(payload: str) -> str:
    """Remove leading ```json fences from LLM responses."""
    if not payload:
        return ""
    text = payload.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines:
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text

def extract_text_from_pdf_bytes(pdf_bytes: bytes, max_chars: int = 25000) -> str:
    """
    Very basic PDF text extractor using pypdf from bytes.
    For hackathon use, this is fine.
    """
    reader = PdfReader(io.BytesIO(pdf_bytes))
    texts = []
    for page in reader.pages:
        try:
            t = page.extract_text() or ""
        except Exception:
            t = ""
        if t:
            texts.append(t)
        # simple truncation to avoid huge prompts
        if sum(len(x) for x in texts) >= max_chars:
            break

    full_text = "\n\n".join(texts)
    if not full_text.strip():
        raise ValueError("No extractable text found in PDF")
    # hard truncate to max_chars
    return full_text[:max_chars]

def summarize_full_document(text: str, max_output_length: int = 1000) -> str:
    hashtags_str = ", ".join(f"#{tag}" for tag in hashtags)
    prompt = (
        "Du bist ein Assistent, der offizielle Dokumente der Landeshauptstadt München "
        "für Bürger:innen leicht verständlich zusammenfasst.\n\n"
        "Erstelle eine Antwort ausschließlich als valides JSON mit folgendem Schema:\n"
        "{\n"
        '  "title": "Kurzer präziser Titel",\n'
        f'  "summary": "Maximal ca. {max_output_length} Wörter",\n'
        f'  "kids_summary": "Sehr kurze, einfache Erklärung für Kinder",\n'
        '  "hashtags": ["#verkehr", "#wohnen", ...]\n'
        "}\n\n"
        "Regeln:\n"
        f"- title: ein Satz, informativ, so kurz wie möglich.\n"
        f"- summary: neutrale Zusammenfassung, max. ca. {max_output_length} Wörter.\n"
        f"- kids_summary: 2–4 Sätze, extrem einfach erklärt, ohne Fremdwörter, so dass Kinder es verstehen.\n"
        "- hashtags: Wähle 1-4 passende Tags aus dieser Liste: "
        f"{hashtags_str}. Gib sie als JSON-Array. Falls keiner passt, gib [].\n"
        "- Antworte ohne zusätzliche Erklärung und ohne JEGLICHE Markdown-Codeblöcke, nur JSON.\n\n"
        "Text:\n"
        f"{text}"
    )

    response = text_model.generate_content(prompt)

    return response.text.strip()

def generate_glossary_entries(summary_text: str, max_entries: int = 5) -> List[Dict[str, str]]:
    if not summary_text or not summary_text.strip():
        return []

    prompt = (
        f"Identifiziere bis zu {max_entries} Begriffe oder Ausdrücke, die für Bürger:innen "
        "schwer verständlich sein könnten. Gib zu jedem Begriff eine Erklärung in 1-2 kurzen "
        "Sätzen ohne Fachjargon. Antworte ausschließlich als valides JSON-Array in der Form "
        ' [{"term": "Begriff", "description": "Erklärung"}]. Wenn keine Begriffe nötig sind, gib [].\n\n'
        "Text:\n"
        f"{summary_text}"
    )

    response = text_model.generate_content(prompt)
    cleaned = _strip_markdown_block(response.text or "")
    try:
        raw_entries = json.loads(cleaned)
    except json.JSONDecodeError:
        return []

    if not isinstance(raw_entries, list):
        return []

    glossary: List[Dict[str, str]] = []
    for entry in raw_entries:
        if not isinstance(entry, dict):
            continue
        term = str(entry.get("term", "")).strip()
        description = str(entry.get("description", "")).strip()
        if not term or not description:
            continue
        glossary.append({"term": term, "description": description})
        if len(glossary) >= max_entries:
            break

    return glossary


def _parse_summary_payload(payload: str) -> Dict[str, Any]:
    cleaned = _strip_markdown_block(payload)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise RuntimeError("Failed to parse summary JSON from Gemini response") from exc


async def create_structured_summary(req: RequestVariables) -> Dict[str, Any]:
    try:
        pdf_bytes = base64.b64decode(req.pdf_base64)
        text = extract_text_from_pdf_bytes(pdf_bytes, max_chars=req.max_chars or 20000)
    except Exception as e:
        raise RuntimeError(f"PDF extraction error: {e}")

    payload_str = summarize_full_document(text, max_output_length=req.max_output_length or 1000)

    cleaned = _strip_markdown_block(payload_str)

    try:
        payload = json.loads(cleaned)
    except Exception as e:
        raise RuntimeError(f"Invalid JSON from model: {e}\nReturned:\n{cleaned}")

    glossary: List[Dict[str, str]] = []
    try:
        glossary = generate_glossary_entries(payload.get("summary", ""))
    except Exception as err:
        print("Glossary generation warning:", err)

    payload["glossary"] = glossary
    
    prompt = payload.get("kids_summary", "")
    prompt += (
        "\n\nGenerate a cartoonish, family-friendly, colorful illustration "
        "directly related to this text. "
        "Do not include text in the image. "
        "Resolution: 1536 x 1024 pixels."
    )
    
    response = image_model.generate_content(prompt)

    print("Got", len(response.candidates), "candidate(s)")
    image_base64 = None

    for part in response.candidates[0].content.parts:
        if getattr(part, "inline_data", None):
            img_bytes = part.inline_data.data
            image_base64 = base64.b64encode(img_bytes).decode("utf-8")
            break

    return {
        "summary_json": payload,
        "image_base64": image_base64,
        "glossary": glossary,
    }
