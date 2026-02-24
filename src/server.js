// src/server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import config from "./config.js";
import apiRoutes from "./routes.js";
import { startScheduler } from "./scheduler.js";
import { fetchAllPosts } from "./fetcher.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use("/api", apiRoutes);
app.get("*", (_, res) =>
  res.sendFile(path.join(__dirname, "../public/index.html"))
);

app.listen(config.PORT, async () => {
  console.log(`\n🚀 FB Viral Feed (RSS Edition) running at http://localhost:${config.PORT}`);
  console.log(`   Sources: ${config.RSS_SOURCES.length} RSS feeds configured`);
  console.log(`   No API keys required!\n`);
  startScheduler();

  // Auto-fetch on startup if no data exists
  const { loadPosts } = await import("./storage.js");
  if (loadPosts().length === 0) {
    console.log("[STARTUP] No cached data found — fetching now...");
    await fetchAllPosts();
  }
});