/**
 * API Layer — Express server setup.
 */

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { config } from "../config.js";
import { createRoutes } from "./routes.js";
import type { QuillAgent } from "../agent/quill.agent.js";

const ALLOWED_ORIGINS = [
  "https://quill-rag.vercel.app",
  "http://localhost:5173",
  "http://localhost:4173",
];

const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a minute before trying again." },
});

/**
 * Create and configure the Express server.
 */
export function createServer(agent: QuillAgent) {
  const app = express();

  // Middleware
  app.use(cors({ origin: ALLOWED_ORIGINS, optionsSuccessStatus: 200 }));
  app.use(express.json({ limit: "64kb" }));
  app.use("/api", apiLimiter);

  // Request logging
  app.use((req, _res, next) => {
    console.log(`[API] ${req.method} ${req.path}`);
    next();
  });

  // Routes
  const routes = createRoutes(agent);
  app.use("/api", routes);

  return app;
}

/**
 * Start the server on the configured port.
 */
export function startServer(agent: QuillAgent) {
  const app = createServer(agent);

  app.listen(config.port, () => {
    console.log(`\n🚀 CopywrightRAG server running on http://localhost:${config.port}`);
    console.log(`   Health: http://localhost:${config.port}/api/health`);
    console.log(`   Generate: POST http://localhost:${config.port}/api/generate-copy\n`);
  });

  return app;
}
