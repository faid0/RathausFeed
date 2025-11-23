import { Router } from "express";
import { postLocalSummary } from "../controllers/summaryController.js";

const router = Router();

router.post("/", postLocalSummary);

router.get("/", (req, res) => {
    res.send("Summaries endpoint is live. Use POST to summarize PDFs.");
});

export default router;