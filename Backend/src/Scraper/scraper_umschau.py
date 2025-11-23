import requests
import os
from datetime import datetime, timedelta
import io
import PyPDF2  # you need to install this: pip install PyPDF2
import sqlite3
from ai_service import RequestVariables, create_structured_summary
import asyncio
import aiohttp
import base64
import json

max_output_length = 200


def _strip_markdown_block(payload: str) -> str:
    """Remove leading ```json fences from Gemini responses."""
    if not payload:
        return ""
    text = payload.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        # drop opening fence
        if lines:
            lines = lines[1:]
        # drop closing fence if present
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text

def extract_text_from_pdf(filename: str):
    try:
        with open(filename, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text
    except FileNotFoundError:
        print(f"File not found: {filename}")
        return None

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

async def download_pdf(year: int, date_str: str):
    url = f"https://ru.muenchen.de/pdf/{year}/ru-{date_str}.pdf"
    print("Checking URL:", url)

    async with aiohttp.ClientSession() as session:
        async with session.head(url) as resp:
            if resp.status != 200:
                print("PDF not found (status code):", resp.status)
                return False

        async with session.get(url) as resp2:
            pdf_bytes = requests.get(url).content
            pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")
            
            result = await create_structured_summary(RequestVariables(
                pdf_base64=pdf_base64,
                max_chars=len(pdf_bytes),
                max_output_length=max_output_length
            ))

            summary_result = result["summary_json"] 
            image_bytes = result["image_base64"]

            if hasattr(summary_result, "model_dump"):
                summary_payload = summary_result.model_dump()
            elif isinstance(summary_result, dict):
                summary_payload = summary_result
            elif isinstance(summary_result, str):
                cleaned = _strip_markdown_block(summary_result)
                summary_payload = json.loads(cleaned)
            else:
                summary_payload = {
                    "title": getattr(summary_result, "title", ""),
                    "summary": getattr(summary_result, "summary", ""),
                    "kids_summary": getattr(summary_result, "kids_summary", ""),
                    "hashtags": getattr(summary_result, "hashtags", []),
                }

            title = summary_payload.get("title") or "Ohne Titel"
            summary_text = summary_payload.get("summary") or ""
            kids_summary_text = summary_payload.get("kids_summary") or ""
            hashtags = summary_payload.get("hashtags") or []
            glossary_entries = summary_payload.get("glossary") or []
            if not isinstance(hashtags, list):
                hashtags = [str(hashtags)]

            sanitized_glossary = []
            if isinstance(glossary_entries, list):
                for entry in glossary_entries:
                    if not isinstance(entry, dict):
                        continue
                    term = str(entry.get("term", "")).strip()
                    description = str(entry.get("description", "")).strip()
                    if not term or not description:
                        continue
                    sanitized_glossary.append({
                        "term": term,
                        "description": description,
                    })
            print("Title:", title)
            print("Summary:", summary_text)
            print("Hashtags:", ", ".join(hashtags))

            script_dir = os.path.dirname(os.path.abspath(__file__))
            db_path = os.path.join(script_dir, "../../dev.db")
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()

            cursor.execute("""
                INSERT OR IGNORE INTO posts (title, URL, summary, kids_summary, image, createdAt)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (title, url, summary_text, kids_summary_text, sqlite3.Binary(base64.b64decode(image_bytes)) if image_bytes else None, date_str))

            cursor.execute("SELECT id FROM posts WHERE URL = ?", (url,))
            row = cursor.fetchone()
            if row is None:
                raise RuntimeError(f"Failed to fetch post id for URL {url}")
            post_id = row[0]

            cursor.execute(
                "DELETE FROM glossary_entries WHERE postId = ?",
                (post_id,),
            )

            for entry in sanitized_glossary:
                cursor.execute(
                    """
                    INSERT INTO glossary_entries (postId, term, description)
                    VALUES (?, ?, ?)
                    """,
                    (post_id, entry["term"], entry["description"]),
                )

            for tag in hashtags:
                print("Processing hashtag:", tag)
                normalized = (tag or "").strip().lstrip("#").lower()
                print("Normalized hashtag:", normalized)
                if not normalized:
                    continue
                cursor.execute(
                    "SELECT id FROM hashtags WHERE name = ?",
                    (normalized,)
                )
                hashtag_row = cursor.fetchone()
                if not hashtag_row:
                    continue
                cursor.execute(
                    "INSERT OR IGNORE INTO post_hashtags (postId, hashtagId) VALUES (?, ?)",
                    (post_id, hashtag_row[0]),
                )

            conn.commit()
            conn.close()

            return True
    return False

async def find_latest_pdfs(start_date: datetime, days_to_check: int = 7, nr_pdfs: int = 1):
    k = 0
    for delta in range(days_to_check):
        date = start_date - timedelta(days=delta)
        year = date.year
        date_str = date.strftime("%Y-%m-%d")
        print(year, date_str)
        if await download_pdf(year, date_str):
            k += 1
            if k == nr_pdfs:
                return
    print("No PDF found in last", days_to_check, "days.")

if __name__ == "__main__":
    today = datetime.today()
    asyncio.run(find_latest_pdfs(today, days_to_check=10, nr_pdfs=7))
