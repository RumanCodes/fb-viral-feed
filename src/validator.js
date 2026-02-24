// src/validator.js
// Tests whether an RSS feed URL actually works before saving it.
// Used by the /api/validate-feed endpoint so users can test feeds in the UI.

import axios from "axios";
import Parser from "rss-parser";

const parser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; ViralFeed/2.0; RSS Reader)",
    "Accept":     "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      ["media:content",   "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
    ],
  },
});

/**
 * Validate a feed URL. Returns:
 *  { ok: true,  title, itemCount, latestItem, feedType }
 *  { ok: false, error, suggestion }
 */
export async function validateFeed(url) {
  // ── Block known dead Facebook RSS patterns ─────────────────────────────────
  if (url.includes("facebook.com/feeds/page.php") ||
      url.includes("facebook.com/rss")) {
    return {
      ok:    false,
      error: "Facebook RSS feeds have been shut down by Meta since 2021. They return 404 for all pages.",
      suggestion: suggestAlternative(url),
      isFacebookDead: true,
    };
  }

  // ── Validate actual URL format ─────────────────────────────────────────────
  try { new URL(url); } catch {
    return { ok: false, error: "Invalid URL format. Make sure it starts with http:// or https://" };
  }

  // ── Try to parse it as RSS ─────────────────────────────────────────────────
  try {
    const feed  = await parser.parseURL(url);
    const items = feed.items || [];

    const latestItem = items[0] ? {
      title: items[0].title || "(no title)",
      date:  items[0].pubDate || items[0].isoDate || "unknown",
      link:  items[0].link || "",
    } : null;

    // Detect feed type
    let feedType = "RSS";
    if (url.includes("youtube.com/feeds")) feedType = "YouTube";
    else if (url.includes("reddit.com"))   feedType = "Reddit";
    else if (url.includes("atom"))         feedType = "Atom";

    return {
      ok:        true,
      title:     feed.title || feed.description || "(untitled feed)",
      itemCount: items.length,
      latestItem,
      feedType,
    };
  } catch (err) {
    let error = err.message;
    let suggestion = null;

    if (err.message.includes("404")) {
      error = "Feed not found (404). This URL doesn't exist or has moved.";
    } else if (err.message.includes("403")) {
      error = "Access denied (403). This site blocks RSS readers.";
    } else if (err.message.includes("ENOTFOUND")) {
      error = "Domain not found. Check the URL is spelled correctly.";
    } else if (err.message.includes("ETIMEDOUT") || err.message.includes("timeout")) {
      error = "Request timed out. The server is too slow or unreachable.";
    } else if (err.message.includes("Invalid XML") || err.message.includes("Non-whitespace")) {
      error = "This URL doesn't return a valid RSS/Atom feed. It may be a regular webpage.";
      suggestion = "Try adding /rss, /feed, or /rss.xml to the end of the website URL.";
    }

    return { ok: false, error, suggestion };
  }
}

/**
 * Given a dead Facebook RSS URL, suggest the real official RSS for that page.
 * Covers the most common pages people try to follow.
 */
function suggestAlternative(fbUrl) {
  // Try to extract page name from the URL for a helpful message
  const knownMappings = {
    // Science
    "18898452829":  { name: "NASA",             rss: "https://www.nasa.gov/rss/dyn/breaking_news.rss" },
    "23497828950":  { name: "Nat Geographic",   rss: "https://www.nationalgeographic.com/latest-stories/_jcr_content/list.rss" },
    // News
    "228735667216": { name: "BBC News",         rss: "http://feeds.bbci.co.uk/news/rss.xml" },
    "5550296508":   { name: "CNN",              rss: "http://rss.cnn.com/rss/cnn_topstories.rss" },
    "8062627951":   { name: "TechCrunch",       rss: "https://techcrunch.com/feed/" },
    "Reuters":      { name: "Reuters",          rss: "https://feeds.reuters.com/reuters/topNews" },
  };

  // Check if the URL contains a known page ID
  for (const [id, info] of Object.entries(knownMappings)) {
    if (fbUrl.includes(id)) {
      return `Use the official ${info.name} RSS instead: ${info.rss}`;
    }
  }

  return "Find the page's official website and look for their RSS feed at /rss or /feed";
}