import requests
from bs4 import BeautifulSoup
import os
import io
import PyPDF2
from urllib.parse import urljoin

BASE_URL = "https://risi.muenchen.de/risi/aktuelles"

def extract_text_from_pdf_bytes(pdf_bytes):
    with io.BytesIO(pdf_bytes) as fbuf:
        reader = PyPDF2.PdfReader(fbuf)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text

def get_all_ris_pdfs():
    """Scrape the page and return a list of all PDF URLs."""
    resp = requests.get(BASE_URL)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    pdf_links = []
    for a in soup.find_all("a", href=True):
        href = a["href"]

        if href.startswith("./dokument"):
            full_url = urljoin(BASE_URL, href)
            pdf_links.append(full_url)

    return pdf_links

def download_and_extract(url, save_folder="./RIS"):
    """Download a PDF if not present, extract text, return filename + text."""
    os.makedirs(save_folder, exist_ok=True)

    filename = url.split("/")[-1]
    if not filename.lower().endswith(".pdf"):
        filename += ".pdf"
    filepath = os.path.join(save_folder, filename)

    # Download if file not already present
    if not os.path.exists(filepath):
        print("Downloading:", url)
        resp = requests.get(url)
        resp.raise_for_status()
        with open(filepath, "wb") as f:
            f.write(resp.content)
        pdf_bytes = resp.content
    else:
        print("File exists, reading from disk:", filepath)
        with open(filepath, "rb") as f:
            pdf_bytes = f.read()

    # Extract text
    text = extract_text_from_pdf_bytes(pdf_bytes)
    return filename, text


def download_k_latest(k=3):
    """Download and extract text from the latest k Amtsblatt PDFs."""
    print(f"Fetching Amtsblatt index...")
    pdf_links = get_all_ris_pdfs()

    print(pdf_links)

    if not pdf_links:
        print("No PDF links found.")
        return

    latest_k = pdf_links[:k]

    results = []
    for url in latest_k:
        filename, text = download_and_extract(url)
        print(f"\n--- {filename} (first 300 chars) ---")
        print(text[:300])
        results.append((filename, text))

    return results


if __name__ == "__main__":
    download_k_latest(k=5)   # change this number

#NOT DONE