/**
 * Vercel Serverless Function — catches all /api/* routes.
 * Delegates to the shared Express app.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getApp } from "./_app.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log(`[Vercel] ${req.method} ${req.url}`);
  const app = getApp();
  return app(req as any, res as any);
}
