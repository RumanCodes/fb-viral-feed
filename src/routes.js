// src/routes.js
import { Router } from "express";
import { fetchAllPosts } from "./fetcher.js";
import { loadPosts, savePosts } from "./storage.js";
import { getNextRunTime } from "./scheduler.js";
import { validateFeed } from "./validator.js";
import config from "./config.js";

const router = Router();

// GET /api/posts
router.get("/posts", (req, res) => {
  let posts = loadPosts();
  const { type = "all", source = "all", category = "all", q = "" } = req.query;
  if (type !== "all")     posts = posts.filter(p => p.mediaType === type);
  if (source !== "all")   posts = posts.filter(p => p.page === source);
  if (category !== "all") posts = posts.filter(p => p.category === category);
  if (q) {
    const query = q.toLowerCase();
    posts = posts.filter(p =>
      p.message.toLowerCase().includes(query) ||
      (p.description || "").toLowerCase().includes(query)
    );
  }
  res.json({ total: posts.length, posts });
});

// POST /api/fetch-now
router.post("/fetch-now", async (req, res) => {
  try {
    const posts = await fetchAllPosts();
    res.json({ success: true, fetched: posts.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/stats
router.get("/stats", (req, res) => {
  const posts      = loadPosts();
  const sources    = [...new Set(posts.map(p => p.page))];
  const categories = [...new Set(posts.map(p => p.category))];
  const withImages = posts.filter(p => p.mediaUrl).length;
  const lastFetched = posts.length
    ? posts.reduce((a, b) => a.fetchedAt > b.fetchedAt ? a : b).fetchedAt
    : null;
  res.json({ totalPosts: posts.length, withImages, sources, categories, lastFetched });
});

// GET /api/sources — list configured sources with their type
router.get("/sources", (req, res) => {
  res.json({
    sources: config.RSS_SOURCES.map(s => ({
      name:     s.name,
      category: s.category,
      color:    s.color,
      url:      s.url,
    })),
  });
});

// GET /api/next-run
router.get("/next-run", (req, res) => {
  res.json({ nextRun: getNextRunTime() });
});

// POST /api/validate-feed  — test if a feed URL works BEFORE adding it
// Body: { url: "https://..." }
router.post("/validate-feed", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ ok: false, error: "No URL provided" });
  const result = await validateFeed(url);
  res.json(result);
});

// POST /api/add-source  — dynamically add a new source at runtime
// Body: { name, url, category, color }
router.post("/add-source", async (req, res) => {
  const { name, url, category = "Custom", color = "#1877f2" } = req.body;
  if (!name || !url) return res.status(400).json({ ok: false, error: "name and url are required" });

  // Validate first
  const validation = await validateFeed(url);
  if (!validation.ok) {
    return res.status(400).json({ ok: false, error: validation.error, suggestion: validation.suggestion });
  }

  // Add to runtime config (resets on server restart — edit config.js to persist)
  config.RSS_SOURCES.push({ name, url, category, color });
  res.json({ ok: true, message: `Added "${name}" — fetch now to load its posts`, validation });
});

// DELETE /api/remove-source  — remove a source by name at runtime
router.delete("/remove-source/:name", (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const idx  = config.RSS_SOURCES.findIndex(s => s.name === name);
  if (idx === -1) return res.status(404).json({ ok: false, error: "Source not found" });
  config.RSS_SOURCES.splice(idx, 1);
  res.json({ ok: true, message: `Removed "${name}"` });
});

export default router;