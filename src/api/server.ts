/**
 * API Layer — Express server setup.
 */

import express from "express";
import cors from "cors";
import { config } from "../config.js";
import { createRoutes } from "./routes.js";
import type { QuillAgent } from "../agent/quill.agent.js";

/**
 * Create and configure the Express server.
 */
export function createServer(agent: QuillAgent) {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

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
