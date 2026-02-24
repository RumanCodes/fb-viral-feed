// src/storage.js
import fs from "fs";
import path from "path";
import config from "./config.js";

function ensureDataDir() {
  const dir = path.dirname(config.DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function loadPosts() {
  ensureDataDir();
  if (!fs.existsSync(config.DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(config.DATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}

export function savePosts(newPosts) {
  ensureDataDir();
  const existing   = loadPosts();
  const existingIds = new Set(existing.map((p) => p.id));
  const fresh      = newPosts.filter((p) => !existingIds.has(p.id));
  const combined   = [...fresh, ...existing].slice(0, config.MAX_STORED_POSTS);
  fs.writeFileSync(config.DATA_FILE, JSON.stringify(combined, null, 2), "utf-8");
  return combined;
}