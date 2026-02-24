// src/config.js
// ─────────────────────────────────────────────────────────────────────────────
// Facebook's RSS feed endpoint (feeds/page.php) is largely dead since 2021
// and returns 404 for most pages. This config uses WORKING alternatives:
//
//  1. Standard RSS feeds  — news sites, blogs (always reliable)
//  2. RSS Bridge          — converts Facebook pages to RSS (self-hosted option)
//  3. Nitter-style proxies— for social content aggregation
//
// For Facebook-specific content, the BEST working free methods are:
//  - Follow the page's official website RSS (e.g. nasa.gov instead of fb/nasa)
//  - Use the page's official news/blog RSS
// ─────────────────────────────────────────────────────────────────────────────
import "dotenv/config";

const config = {

  RSS_SOURCES: [

    // ── World News ──────────────────────────────────────────────────────────
    { name: "BBC News",          category: "World",       color: "#bb1919", url: "http://feeds.bbci.co.uk/news/rss.xml" },
    { name: "BBC World Service", category: "World",       color: "#bb1919", url: "http://feeds.bbci.co.uk/news/world/rss.xml" },
    { name: "Reuters",           category: "World",       color: "#ff8000", url: "https://feeds.reuters.com/reuters/topNews" },
    { name: "Al Jazeera",        category: "World",       color: "#009b74", url: "https://www.aljazeera.com/xml/rss/all.xml" },
    { name: "Associated Press",  category: "World",       color: "#cc0000", url: "https://feeds.apnews.com/rss/apf-topnews" },
    { name: "The Guardian",      category: "World",       color: "#005689", url: "https://www.theguardian.com/world/rss" },

    // ── Technology ─────────────────────────────────────────────────────────
    { name: "TechCrunch",        category: "Technology",  color: "#0a8a3e", url: "https://techcrunch.com/feed/" },
    { name: "The Verge",         category: "Technology",  color: "#e40046", url: "https://www.theverge.com/rss/index.xml" },
    { name: "Wired",             category: "Technology",  color: "#222222", url: "https://www.wired.com/feed/rss" },
    { name: "Ars Technica",      category: "Technology",  color: "#f35020", url: "http://feeds.arstechnica.com/arstechnica/index" },
    { name: "Hacker News",       category: "Technology",  color: "#ff6600", url: "https://hnrss.org/frontpage" },

    // ── Science ────────────────────────────────────────────────────────────
    // These are the OFFICIAL RSS feeds from the same orgs as their FB pages
    { name: "NASA",              category: "Science",     color: "#0b3d91", url: "https://www.nasa.gov/rss/dyn/breaking_news.rss" },
    { name: "NASA JPL",          category: "Science",     color: "#0b3d91", url: "https://www.jpl.nasa.gov/feeds/news" },
    { name: "Nat Geographic",    category: "Science",     color: "#ffcc00", url: "https://www.nationalgeographic.com/latest-stories/_jcr_content/list.rss" },
    { name: "Science Daily",     category: "Science",     color: "#3d9bdc", url: "https://www.sciencedaily.com/rss/top/science.xml" },
    { name: "New Scientist",     category: "Science",     color: "#e8000d", url: "https://www.newscientist.com/feed/home/" },

    // ── Business ───────────────────────────────────────────────────────────
    { name: "Forbes",            category: "Business",    color: "#a00000", url: "https://www.forbes.com/feeds/entrepreneur/index.xml" },
    { name: "Business Insider",  category: "Business",    color: "#005eb8", url: "https://feeds.businessinsider.com/custom/all" },
    { name: "CNBC",              category: "Business",    color: "#005594", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html" },

    // ── Entertainment ──────────────────────────────────────────────────────
    { name: "Variety",           category: "Entertainment", color: "#7b1fa2", url: "https://variety.com/feed/" },
    { name: "Hollywood Reporter",category: "Entertainment", color: "#c8102e", url: "https://www.hollywoodreporter.com/feed/" },

    // ── Reddit (great for viral/trending content) ──────────────────────────
    // Reddit has public RSS for every subreddit — great Facebook alternative!
    { name: "r/worldnews",      category: "Reddit",      color: "#ff4500", url: "https://www.reddit.com/r/worldnews/hot.rss?limit=15" },
    { name: "r/technology",     category: "Reddit",      color: "#ff4500", url: "https://www.reddit.com/r/technology/hot.rss?limit=15" },
    { name: "r/science",        category: "Reddit",      color: "#ff4500", url: "https://www.reddit.com/r/science/hot.rss?limit=15" },
    { name: "r/space",          category: "Reddit",      color: "#ff4500", url: "https://www.reddit.com/r/space/hot.rss?limit=15" },

    // ── YouTube Channels (RSS works for all public channels!) ──────────────
    // Format: https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
    // Find channel ID: go to channel → view source → search "channelId"
    { name: "NASA YouTube",     category: "YouTube",     color: "#ff0000", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCLA_DiR1FfKNvjuUpBHmylQ" },
    { name: "Veritasium",       category: "YouTube",     color: "#ff0000", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCHnyfMqiRRG1u-2MsSQLbXA" },
    { name: "Kurzgesagt",       category: "YouTube",     color: "#ff0000", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCsXVk37bltHxD1rDPwtNM8Q" },

    // ── Add your own sources here ──────────────────────────────────────────
    // Any RSS/Atom feed URL works. Common patterns:
    //   News sites:  /rss, /feed, /rss.xml, /atom.xml, /feed.xml
    //   Reddit:      https://www.reddit.com/r/SUBREDDIT/hot.rss
    //   YouTube:     https://www.youtube.com/feeds/videos.xml?channel_id=ID
    //   Blogs:       Usually /feed or /rss
  ],

  // ── Fetch Settings ─────────────────────────────────────────────────────────
  MAX_ITEMS_PER_SOURCE: 15,
  MAX_STORED_POSTS:     800,
  FETCH_TIMEOUT_MS:     10000,

  // ── Scheduler ──────────────────────────────────────────────────────────────
  CRON_SCHEDULE: "0 */2 * * *", // Every 2 hours

  // ── Server ─────────────────────────────────────────────────────────────────
  PORT: parseInt(process.env.PORT) || 3001,

  // ── Storage ────────────────────────────────────────────────────────────────
  DATA_FILE: new URL("../data/posts.json", import.meta.url).pathname,
};

export default config;