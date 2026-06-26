/**
 * googleLsaCron.ts — Cron-triggered Google LSA sync endpoint.
 *
 * Unlike the follow-up task executor in routers.ts (a tRPC protectedProcedure,
 * which requires a logged-in user session), this route is meant to be hit by
 * an external scheduler (Railway Cron, or any periodic HTTP pinger) that has
 * no user session to present. It's authorized instead by a shared secret in
 * the x-cron-secret header, checked against the CRON_SECRET env var.
 *
 * Example scheduler config: POST https://hammerapp.ai/api/cron/google-lsa-sync
 * every 5-10 minutes, header `x-cron-secret: <CRON_SECRET value>`.
 */

import type { Express, Request, Response } from "express";
import { ENV } from "./_core/env";
import { syncGoogleLsaLeadsForAllConnectedBusinesses } from "./googleLsaSync";

export function registerGoogleLsaCronRoute(app: Express) {
  app.post("/api/cron/google-lsa-sync", async (req: Request, res: Response) => {
    if (!ENV.cronSecret) {
      console.error("[GoogleLSA Cron] CRON_SECRET is not configured -- refusing to run");
      res.status(503).json({ error: "Cron sync is not configured" });
      return;
    }

    const provided = req.header("x-cron-secret");
    if (provided !== ENV.cronSecret) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const results = await syncGoogleLsaLeadsForAllConnectedBusinesses();
      res.json({ ok: true, results });
    } catch (err: any) {
      console.error("[GoogleLSA Cron] Sync failed:", err?.message ?? err);
      res.status(500).json({ error: "Sync failed" });
    }
  });
}
