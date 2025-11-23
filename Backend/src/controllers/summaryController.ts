import type { Request, Response, NextFunction } from "express";
import { requestSummaryFromPython } from "../services/summaryService.js";

export async function postLocalSummary(
  req: Request<unknown, unknown, { pdfPath?: string, maxOutputLength?: number }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { pdfPath, maxOutputLength } = req.body;

    if (!pdfPath) {
      res.status(400).json({ message: "pdfPath is required" });
      return;
    }

    const result = await requestSummaryFromPython(pdfPath, maxOutputLength);

    res.json({
      pdfPath: result.pdfPath,
      summary: result.summary,
    });
  } catch (err) {
    next(err);
  }
}
