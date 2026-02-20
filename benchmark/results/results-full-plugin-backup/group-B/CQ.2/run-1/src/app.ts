import express from "express";
import postRoutes from "./routes/posts";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/posts", postRoutes);

app.use(errorHandler);

export default app;
