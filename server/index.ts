import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./router";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
  })
);

// OAuth routes (placeholder)
app.get("/api/auth", (req, res) => {
  // In production, redirect to OAuth provider
  res.redirect("/dashboard");
});

app.get("/api/oauth/callback", (req, res) => {
  // In production, handle OAuth callback
  res.redirect("/dashboard");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
