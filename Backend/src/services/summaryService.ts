import fs from "fs/promises";
import path from "path";

export interface SummaryResult {
  pdfPath: string;
  summary: string;
}

const PYTHON_SUMMARY_URL =
  process.env.PYTHON_SUMMARY_URL ?? "http://127.0.0.1:5000/summaries";

export async function requestSummaryFromPython(pdfPath: string, maxOutputLength?: number): Promise<SummaryResult> {
  const fileBuffer = await fs.readFile(pdfPath);
  const base64Pdf = fileBuffer.toString("base64");
  const filename = path.basename(pdfPath);

  const res = await fetch(PYTHON_SUMMARY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      pdf_base64: base64Pdf, 
      pdf_filename: filename,
      max_output_length: maxOutputLength 
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Python summarizer error: ${res.status} ${res.statusText} - ${text}`
    );
  }

  const data = (await res.json()) as { pdf_filename: string; summary: string };
  return {
    pdfPath: pdfPath,
    summary: data.summary,
  };
}
