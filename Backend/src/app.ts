import express from "express";
import cors from "cors";
import type { Application, Request, Response, NextFunction } from "express";
import postRoutes from "./routes/postRoutes.js";
//import paperRoutes from "./routes/paperRoutes.js";
import summaryRoutes from "./routes/summaryRoutes.js";

const app: Application = express();

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the Backend API!");
});

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/posts", postRoutes);

app.use("/summaries", summaryRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

export default app;
