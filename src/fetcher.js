// // src/fetcher.js
// // Fetches articles from RSS feeds — works with standard RSS AND Facebook Page RSS.
// // No API keys required for either.

// import Parser from "rss-parser";
// import config from "./config.js";
// import { savePosts } from "./storage.js";

// // ── Two parsers: one standard, one for Facebook ───────────────────────────────
// // Facebook RSS uses slightly different field names so we configure
// // customFields to capture everything Facebook puts in their feed.

// const standardParser = new Parser({
//   timeout: config.FETCH_TIMEOUT_MS,
//   headers: {
//     "User-Agent": "Mozilla/5.0 (compatible; FBViralFeed/2.0; RSS Reader)",
//     "Accept":     "application/rss+xml, application/xml, text/xml, */*",
//   },
//   customFields: {
//     item: [
//       ["media:content",   "mediaContent"],
//       ["media:thumbnail", "mediaThumbnail"],
//       ["enclosure",       "enclosure"],
//     ],
//   },
// });

// const facebookParser = new Parser({
//   timeout: config.FETCH_TIMEOUT_MS,
//   headers: {
//     // Facebook is more likely to serve the feed with a browser-like User-Agent
//     "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
//     "Accept":     "application/rss+xml, application/xml, text/xml, */*",
//   },
//   customFields: {
//     feed: [
//       ["description", "feedDescription"],
//       ["image",       "feedImage"],
//     ],
//     item: [
//       ["media:content",   "mediaContent"],
//       ["media:thumbnail", "mediaThumbnail"],
//       ["enclosure",       "enclosure"],
//       ["description",     "fbDescription"],
//     ],
//   },
// });

// // ── Detect if a URL is a Facebook RSS feed ───────────────────────────────────

// function isFacebookFeed(url) {
//   return url.includes("facebook.com/feeds") || url.includes("facebook.com/rss");
// }

// // ── Image extraction — tries every possible location ────────────────────────
// // Different RSS sources put images in different places.
// // We check all known locations in order of reliability.

// function extractImage(item) {
//   // 1. Standard media namespace fields (most reliable when present)
//   if (item.mediaContent?.$.url)   return item.mediaContent.$.url;
//   if (item.mediaThumbnail?.$.url) return item.mediaThumbnail.$.url;

//   // 2. Enclosure tag (podcasts and some news sites use this for media)
//   if (item.enclosure?.url && item.enclosure.type?.startsWith("image/"))
//     return item.enclosure.url;

//   // 3. Scrape first <img> tag from any HTML content field
//   //    Facebook puts images here inside the description HTML
//   const html =
//     item["content:encoded"] ||
//     item.fbDescription      ||
//     item.content            ||
//     item.description        || "";

//   const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
//   if (imgMatch) return imgMatch[1];

//   // 4. Some feeds put image URL directly in a custom field
//   if (item.image) return item.image;

//   return ""; // No image found
// }

// // ── Extract clean text from HTML ─────────────────────────────────────────────
// // Facebook descriptions are raw HTML — we strip the tags to get plain text.

// function stripHtml(html = "") {
//   return html
//     .replace(/<br\s*\/?>/gi, " ")   // <br> → space
//     .replace(/<[^>]*>/g, "")        // remove all other tags
//     .replace(/&amp;/g,  "&")        // decode HTML entities
//     .replace(/&lt;/g,   "<")
//     .replace(/&gt;/g,   ">")
//     .replace(/&quot;/g, '"')
//     .replace(/&#39;/g,  "'")
//     .replace(/&nbsp;/g, " ")
//     .trim();
// }

// // ── Normalise one RSS item into our standard shape ───────────────────────────

// function normaliseItem(item, source, isFacebook = false) {
//   const id = item.guid || item.id || item.link || `${source.name}-${item.title}`;

//   const rawDesc = isFacebook
//     ? stripHtml(item.fbDescription || item.description || "")
//     : (item.contentSnippet || stripHtml(item.description || item.summary || ""));

//   const description = rawDesc.slice(0, 500);
//   const message     = item.title ? stripHtml(item.title) : description.slice(0, 120);
//   const mediaUrl    = extractImage(item);

//   return {
//     id,
//     page:         source.name,
//     category:     source.category,
//     color:        source.color,
//     isFacebook,
//     message,
//     description:  description !== message ? description : "",
//     createdTime:  item.pubDate || item.isoDate || new Date().toISOString(),
//     mediaUrl,
//     mediaType:    mediaUrl ? "photo" : "article",
//     permalink:    item.link || "",
//     source:       source.url,
//     fetchedAt:    new Date().toISOString(),
//     likes:        0,
//     shares:       0,
//     comments:     0,
//     engagement:   0,
//   };
// }

// // ── Fetch one source ──────────────────────────────────────────────────────────

// async function fetchSource(source) {
//   const isFacebook = isFacebookFeed(source.url);

//   try {
//     const parser = isFacebook ? facebookParser : standardParser;
//     const feed   = await parser.parseURL(source.url);
//     const items  = feed.items.slice(0, config.MAX_ITEMS_PER_SOURCE);

//     console.log(`  ✓ ${source.name}: ${items.length} items${isFacebook ? " [Facebook]" : ""}`);
//     return items.map(item => normaliseItem(item, source, isFacebook));

//   } catch (err) {
//     let hint = err.message;
//     if (err.message.includes("403")) hint += " — Facebook may have blocked this. Try again later.";
//     if (err.message.includes("404")) hint += " — Feed not found. Check the Page ID is correct.";
//     if (err.message.includes("ENOTFOUND")) hint += " — DNS/network failure.";
//     console.error(`  [ERROR] "${source.name}": ${hint}`);
//     return [];
//   }
// }

// // ── Main export ───────────────────────────────────────────────────────────────

// export async function fetchAllPosts() {
//   const timestamp = new Date().toLocaleString();
//   const fbCount   = config.RSS_SOURCES.filter(s => isFacebookFeed(s.url)).length;
//   const rssCount  = config.RSS_SOURCES.length - fbCount;

//   console.log(`\n[${timestamp}] Fetching from ${config.RSS_SOURCES.length} sources (${rssCount} RSS + ${fbCount} Facebook)...`);

//   const results = await Promise.allSettled(
//     config.RSS_SOURCES.map(source => fetchSource(source))
//   );

//   const allPosts = results
//     .filter(r => r.status === "fulfilled")
//     .flatMap(r => r.value);

//   allPosts.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));

//   const failed = results.filter(r => r.status === "rejected").length;
//   console.log(`  ✓ Fetched ${allPosts.length} posts total.${failed > 0 ? ` (${failed} sources failed)` : ""}`);

//   savePosts(allPosts);
//   return allPosts;
// }

// src/fetcher.js
// Fetches from RSS, Reddit, and YouTube feeds.
// Facebook's RSS endpoint (feeds/page.php) is dead — removed.

import Parser from "rss-parser";
import config from "./config.js";
import { savePosts } from "./storage.js";

// ── Parsers ───────────────────────────────────────────────────────────────────

// Standard parser — for news sites, blogs, etc.
const standardParser = new Parser({
  timeout: config.FETCH_TIMEOUT_MS,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; ViralFeed/2.0; RSS Reader)",
    "Accept":     "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      ["media:content",   "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["enclosure",       "enclosure"],
    ],
  },
});

// Reddit parser — Reddit RSS uses <media:thumbnail> and different fields
const redditParser = new Parser({
  timeout: config.FETCH_TIMEOUT_MS,
  headers: {
    "User-Agent": "ViralFeed/2.0 RSS Reader (personal use)",
    "Accept":     "application/rss+xml, application/xml, */*",
  },
  customFields: {
    item: [
      ["media:thumbnail", "mediaThumbnail"],
      ["media:content",   "mediaContent"],
      ["author",          "author"],
    ],
  },
});

// YouTube parser — YouTube RSS is Atom format with special fields
const youtubeParser = new Parser({
  timeout: config.FETCH_TIMEOUT_MS,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; ViralFeed/2.0; RSS Reader)",
  },
  customFields: {
    item: [
      ["media:group",     "mediaGroup"],
      ["media:thumbnail", "mediaThumbnail"],
      ["media:content",   "mediaContent"],
    ],
  },
});

// ── Source type detection ─────────────────────────────────────────────────────

function getSourceType(url) {
  if (url.includes("reddit.com"))   return "reddit";
  if (url.includes("youtube.com"))  return "youtube";
  return "standard";
}

// ── Image extraction ──────────────────────────────────────────────────────────

function extractImage(item, sourceType) {
  // YouTube — thumbnail is inside media:group
  if (sourceType === "youtube") {
    const group = item.mediaGroup;
    if (group) {
      // media:group contains media:thumbnail
      const thumb = group["media:thumbnail"];
      if (thumb?.[0]?.$?.url) return thumb[0].$.url;
      if (thumb?.$?.url)      return thumb.$.url;
    }
    if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
    // YouTube video ID from link
    const videoId = (item.link || item.id || "").match(/v=([^&]+)/)?.[1] ||
                    (item.link || "").match(/youtu\.be\/([^?]+)/)?.[1];
    if (videoId) return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }

  // Reddit — thumbnail is in mediaThumbnail
  if (sourceType === "reddit") {
    const thumb = item.mediaThumbnail?.$?.url || item.mediaThumbnail?.$.url;
    if (thumb && !thumb.includes("external-preview") && thumb.startsWith("http")) return thumb;
    if (item.mediaContent?.$?.url) return item.mediaContent.$.url;
  }

  // Standard RSS
  if (item.mediaContent?.$?.url)   return item.mediaContent.$.url;
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  if (item.enclosure?.url && item.enclosure.type?.startsWith("image/"))
    return item.enclosure.url;

  // Scrape first <img> from HTML content
  const html = item["content:encoded"] || item.content || item.description || "";
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m && m[1].startsWith("http")) return m[1];

  return "";
}

// ── Strip HTML ────────────────────────────────────────────────────────────────

function stripHtml(html = "") {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ── Normalise Reddit item ─────────────────────────────────────────────────────

function normaliseReddit(item, source) {
  // Reddit titles are the post title — clean and usable
  const message = item.title || "";
  // Description has HTML with the post content and comments link
  const rawDesc = stripHtml(item.content || item.description || "");
  // Remove "submitted by /u/username" boilerplate Reddit adds
  const description = rawDesc
    .replace(/submitted by\s+\/u\/\S+/gi, "")
    .replace(/\[\S+\]\s*$/, "")
    .trim()
    .slice(0, 400);

  return {
    id:          item.guid || item.link,
    page:        source.name,
    category:    source.category,
    color:       source.color,
    sourceType:  "reddit",
    message,
    description,
    author:      item.author || item.creator || "",
    createdTime: item.pubDate || item.isoDate || new Date().toISOString(),
    mediaUrl:    extractImage(item, "reddit"),
    mediaType:   "article",
    permalink:   item.link || "",
    source:      source.url,
    fetchedAt:   new Date().toISOString(),
    likes: 0, shares: 0, comments: 0, engagement: 0,
  };
}

// ── Normalise YouTube item ────────────────────────────────────────────────────

function normaliseYouTube(item, source) {
  // Extract video ID for thumbnail fallback
  const videoId =
    (item.link || "").match(/v=([^&]+)/)?.[1] ||
    (item.id   || "").match(/video:(.+)/)?.[1] || "";

  const mediaUrl = extractImage(item, "youtube") ||
    (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "");

  const description = stripHtml(
    item["media:group"]?.["media:description"]?.[0] ||
    item.contentSnippet ||
    item.description || ""
  ).slice(0, 400);

  return {
    id:          item.guid || item.link || item.id,
    page:        source.name,
    category:    source.category,
    color:       source.color,
    sourceType:  "youtube",
    message:     item.title || "",
    description,
    author:      item.author || item.creator || source.name,
    createdTime: item.pubDate || item.isoDate || new Date().toISOString(),
    mediaUrl,
    mediaType:   "video",
    permalink:   item.link || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : ""),
    source:      source.url,
    fetchedAt:   new Date().toISOString(),
    likes: 0, shares: 0, comments: 0, engagement: 0,
  };
}

// ── Normalise standard RSS item ───────────────────────────────────────────────

function normaliseStandard(item, source) {
  const rawDesc = item.contentSnippet || stripHtml(item.description || item.summary || "");
  const description = rawDesc.trim().slice(0, 400);
  const message     = item.title ? stripHtml(item.title) : description.slice(0, 120);
  const mediaUrl    = extractImage(item, "standard");

  return {
    id:          item.guid || item.id || item.link || `${source.name}-${item.title}`,
    page:        source.name,
    category:    source.category,
    color:       source.color,
    sourceType:  "rss",
    message,
    description: description !== message ? description : "",
    createdTime: item.pubDate || item.isoDate || new Date().toISOString(),
    mediaUrl,
    mediaType:   mediaUrl ? "photo" : "article",
    permalink:   item.link || "",
    source:      source.url,
    fetchedAt:   new Date().toISOString(),
    likes: 0, shares: 0, comments: 0, engagement: 0,
  };
}

// ── Fetch one source ──────────────────────────────────────────────────────────

async function fetchSource(source) {
  const type = getSourceType(source.url);
  const parser = type === "reddit"  ? redditParser
               : type === "youtube" ? youtubeParser
               : standardParser;

  try {
    const feed  = await parser.parseURL(source.url);
    const items = feed.items.slice(0, config.MAX_ITEMS_PER_SOURCE);

    const normalise = type === "reddit"  ? normaliseReddit
                    : type === "youtube" ? normaliseYouTube
                    : normaliseStandard;

    const posts = items.map(item => normalise(item, source)).filter(p => p.message);
    console.log(`  ✓ [${type.padEnd(8)}] ${source.name}: ${posts.length} items`);
    return posts;

  } catch (err) {
    // Give actionable error messages
    let hint = err.message;
    if (err.message.includes("404"))  hint = "Feed URL not found (404). Check if the URL is still valid.";
    if (err.message.includes("403"))  hint = "Access denied (403). The site may be blocking RSS requests.";
    if (err.message.includes("401"))  hint = "Unauthorised (401). This feed requires authentication.";
    if (err.message.includes("ENOTFOUND")) hint = "DNS error. Check your internet connection.";
    if (err.message.includes("ETIMEDOUT")) hint = `Timed out after ${config.FETCH_TIMEOUT_MS/1000}s.`;
    console.error(`  ✗ [${type.padEnd(8)}] "${source.name}": ${hint}`);
    return [];
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function fetchAllPosts() {
  const timestamp = new Date().toLocaleString();
  const byType    = { reddit: 0, youtube: 0, standard: 0 };
  config.RSS_SOURCES.forEach(s => byType[getSourceType(s.url)]++);

  console.log(
    `\n[${timestamp}] Fetching ${config.RSS_SOURCES.length} sources` +
    ` (${byType.standard} RSS | ${byType.reddit} Reddit | ${byType.youtube} YouTube)...`
  );

  // Run ALL fetches in parallel
  const results = await Promise.allSettled(
    config.RSS_SOURCES.map(source => fetchSource(source))
  );

  const allPosts = results
    .filter(r => r.status === "fulfilled")
    .flatMap(r => r.value);

  // Sort newest first
  allPosts.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));

  const failed = results.filter(r => r.status === "rejected").length;
  console.log(
    `\n  ✓ Total: ${allPosts.length} posts fetched.` +
    (failed > 0 ? ` (${failed} sources failed)` : " All sources OK.")
  );

  savePosts(allPosts);
  return allPosts;
}