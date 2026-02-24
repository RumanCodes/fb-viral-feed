# 📡 FB Viral Feed — Node.js

A self-hosted open-source web app built with **Node.js + Express** that automatically fetches and displays viral posts (photos & videos) from tracked Facebook Pages — updated daily via a built-in scheduler.

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js **v18+** (uses ES Modules)
- A Facebook Developer account

### 2. Get Facebook API Credentials

1. Go to [developers.facebook.com](https://developers.facebook.com/)
2. Create a new App → choose **"Business"** type
3. Go to **Settings → Basic** → copy your **App ID** and **App Secret**
4. Generate an Access Token at [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)
   - Select your app → click **"Generate Access Token"**
   - Add permissions: `pages_read_engagement`, `pages_show_list`

### 3. Configure

```bash
# 1. Clone or copy this project, then:
cp .env.example .env

# 2. Edit .env and fill in your credentials:
#    FB_APP_ID=your_app_id
#    FB_APP_SECRET=your_app_secret
```

**Edit `src/config.js`** to add the pages you want to track:

```js
TRACKED_PAGES: [
  "bbcnews",
  "cnn",
  "TechCrunch",
  "NASA",
  "natgeo",
  // Add any public page username or numeric ID
],
```

Tune the viral thresholds too:

```js
MIN_LIKES:    500,
MIN_SHARES:   100,
MIN_COMMENTS: 50,
```

### 4. Install & Run

```bash
npm install

# Production
npm start

# Development (auto-restarts on file changes)
npm run dev
```

Open your browser at: **http://localhost:3000**

---

## ✨ Features

| Feature | Details |
|---|---|
| 📸 Photo & Video cards | Thumbnails, media type badge, permalink |
| 🔍 Search | Filter posts by keyword in real time |
| 🗂️ Type filter | All / Photos / Videos pill buttons |
| 📋 Page filter | Dropdown to view one page at a time |
| 📊 Sort options | By engagement, newest, most liked, most shared |
| 📈 Engagement bar | Visual indicator of relative virality |
| ⚡ Fetch Now | Manual trigger button |
| 🕐 Auto-fetch | Daily cron at 8:00 AM (configurable) |
| 💾 Local storage | `data/posts.json` — no database needed |
| 🌙 Dark UI | Easy on the eyes |

---

## 📁 Project Structure

```
fb-viral-feed/
├── src/
│   ├── server.js      Express entry point + static serving
│   ├── routes.js      All /api/* endpoints
│   ├── fetcher.js     Facebook Graph API logic
│   ├── scheduler.js   node-cron daily scheduler
│   ├── storage.js     Read / write posts.json
│   └── config.js      Credentials + all settings
├── public/
│   └── index.html     Frontend UI (single file)
├── data/
│   └── posts.json     Auto-created on first fetch
├── .env.example       Environment variable template
├── package.json
└── README.md
```

---

## 🛠️ Customisation

| What | Where |
|---|---|
| Tracked pages | `src/config.js` → `TRACKED_PAGES` |
| Viral thresholds | `src/config.js` → `MIN_LIKES`, `MIN_SHARES`, `MIN_COMMENTS` |
| Auto-fetch time | `src/config.js` → `CRON_SCHEDULE` (cron format) |
| Max stored posts | `src/config.js` → `MAX_STORED_POSTS` |
| Server port | `.env` → `PORT` |
| UI styling | `public/index.html` → CSS variables in `:root` |

---

## ⚠️ Facebook API Notes

- You can only fetch posts from **specific public Pages** you list — not a global feed
- A basic **App Access Token** (`APP_ID|APP_SECRET`) works for reading public page posts locally
- For production / public deployment you'll need **Facebook App Review**
- Be mindful of rate limits — avoid fetching more than once per hour

---

## 📜 License

MIT — free to use, modify, and distribute.
# fb-viral-feed
