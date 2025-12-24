import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { clientsRouter } from "./routes/clients";
import { tradiesRouter } from "./routes/tradies";
import { jobsRouter } from "./routes/jobs";
import { scheduleRouter } from "./routes/schedule";
import { notesRouter } from "./routes/notes";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/clients", clientsRouter);
app.use("/tradies", tradiesRouter);
app.use("/jobs", jobsRouter);
app.use("/schedule", scheduleRouter);
app.use("/notes", notesRouter);

app.use(errorHandler);

const port = process.env.PORT || 4000;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`TradieDr backend listening on http://localhost:${port}`);
});


