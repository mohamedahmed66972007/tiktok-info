import { Router, type IRouter } from "express";
import {
  GetTikTokProfileQueryParams,
  GetTikTokProfileResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

type UnknownRecord = Record<string, unknown>;

const DEFAULT_HOST = "tiktok-scraper7.p.rapidapi.com";

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordAt(value: unknown, path: string[]): unknown {
  let current = value;
  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return current;
}

function first(value: unknown, paths: string[][]): unknown {
  for (const path of paths) {
    const found = recordAt(value, path);
    if (found !== undefined && found !== null && found !== "") return found;
  }
  return undefined;
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[, ]/g, "");
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (["true", "yes", "1"].includes(normalized)) return true;
    if (["false", "no", "0"].includes(normalized)) return false;
  }
  return undefined;
}

function asRecord(value: unknown): UnknownRecord | undefined {
  return isRecord(value) ? value : undefined;
}

function findArray(value: unknown, keys: string[]): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return [];
  for (const key of keys) {
    const found = value[key];
    if (Array.isArray(found)) return found;
    const nested = findArray(found, keys);
    if (nested.length > 0) return nested;
  }
  return [];
}

async function fetchJson(host: string, path: string, key: string) {
  const url = new URL(`https://${host}${path}`);
  const response = await fetch(url, {
    headers: {
      "x-rapidapi-key": key,
      "x-rapidapi-host": host,
      accept: "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });

  const text = await response.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { message: text };
  }

  if (!response.ok) {
    const message = asString(first(body, [["message"], ["error"], ["detail"]])) ?? response.statusText;
    throw new Error(`${response.status}: ${message}`);
  }

  return body;
}

async function fetchFirstSuccessful(
  host: string,
  paths: string[],
  key: string,
  log: { warn: (obj: unknown, msg: string) => void },
) {
  const failures: string[] = [];
  for (const path of paths) {
    try {
      return await fetchJson(host, path, key);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failures.push(`${path} -> ${message}`);
      log.warn({ path, err }, "TikTok scraper endpoint failed");
    }
  }
  throw new Error(failures.join(" | "));
}

function withParams(path: string, params: Record<string, string | number | undefined>) {
  const [pathname, query = ""] = path.split("?");
  const search = new URLSearchParams(query);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  return `${pathname}?${search.toString()}`;
}

function getDataRecord(raw: unknown): UnknownRecord {
  const data = first(raw, [["data"], []]);
  return isRecord(data) ? data : {};
}

function getUserId(raw: unknown) {
  return asString(
    first(raw, [
      ["data", "user", "id"],
      ["data", "id"],
      ["user", "id"],
      ["id"],
    ]),
  );
}

function getItemsFromRaw(raw: unknown, keys: string[]) {
  return findArray(raw, keys).filter(isRecord);
}

function mergeVideoPages(pages: unknown[], keys: string[]) {
  const seen = new Set<string>();
  const videos: UnknownRecord[] = [];
  for (const page of pages) {
    for (const item of getItemsFromRaw(page, keys)) {
      const id = asString(first(item, [["id"], ["aweme_id"], ["storyId"], ["video_id"]])) ?? JSON.stringify(item);
      if (!seen.has(id)) {
        seen.add(id);
        videos.push(item);
      }
    }
  }
  const firstPage = pages[0];
  return {
    ...(isRecord(firstPage) ? firstPage : {}),
    data: {
      ...getDataRecord(firstPage),
      videos,
      hasMore: false,
    },
  };
}

async function fetchAllPages(
  host: string,
  basePaths: string[],
  key: string,
  keys: string[],
  log: { warn: (obj: unknown, msg: string) => void },
) {
  const failures: string[] = [];
  for (const basePath of basePaths) {
    const pages: unknown[] = [];
    let cursor: string | number | undefined;
    let lastCursor: string | number | undefined;

    for (let page = 0; page < 12; page += 1) {
      const path = withParams(basePath, {
        count: 30,
        cursor,
      });

      try {
        const raw = await fetchJson(host, path, key);
        pages.push(raw);

        const data = getDataRecord(raw);
        const hasMore = asBoolean(data["hasMore"]) ?? asBoolean(data["has_more"]) ?? false;
        const nextCursor = asString(data["cursor"]) ?? asNumber(data["cursor"]);

        if (!hasMore || nextCursor === undefined || nextCursor === lastCursor) {
          return mergeVideoPages(pages, keys);
        }

        lastCursor = cursor;
        cursor = nextCursor;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        failures.push(`${path} -> ${message}`);
        log.warn({ path, err }, "TikTok paged endpoint failed");
        break;
      }
    }

    if (pages.length > 0) {
      return mergeVideoPages(pages, keys);
    }
  }

  throw new Error(failures.join(" | "));
}

async function fetchPagedUserIds(host: string, type: "followers" | "following", userId: string, key: string) {
  const firstPath = `/user/${type}?user_id=${encodeURIComponent(userId)}&count=1`;
  const firstRaw = await fetchJson(host, firstPath, key);
  const firstData = getDataRecord(firstRaw);
  const total = asNumber(firstData["total"]);
  const maxFriendScan = Number(process.env.TIKTOK_MAX_FRIEND_SCAN ?? 5000);

  if (total !== undefined && total > maxFriendScan) {
    return { ids: new Set<string>(), complete: false };
  }

  const ids = new Set<string>();
  let time: string | number | undefined;

  for (let page = 0; page < 80; page += 1) {
    const path = withParams(`/user/${type}?user_id=${encodeURIComponent(userId)}`, {
      count: 100,
      time,
    });
    const raw = await fetchJson(host, path, key);
    const data = getDataRecord(raw);
    const users = getItemsFromRaw(data, [type === "followers" ? "followers" : "followings", "users", "data"]);

    for (const user of users) {
      const id = asString(first(user, [["id"], ["unique_id"], ["uniqueId"], ["sec_uid"]]));
      if (id) ids.add(id);
    }

    const hasMore = asBoolean(data["hasMore"]) ?? false;
    const nextTime = asString(data["time"]) ?? asNumber(data["time"]);
    if (!hasMore || nextTime === undefined || nextTime === time) {
      return { ids, complete: true };
    }
    time = nextTime;
  }

  return { ids, complete: false };
}

async function computeFriendCount(host: string, userId: string | undefined, key: string) {
  if (!userId) return undefined;
  try {
    const [followers, following] = await Promise.all([
      fetchPagedUserIds(host, "followers", userId, key),
      fetchPagedUserIds(host, "following", userId, key),
    ]);
    if (!followers.complete || !following.complete) return undefined;
    let total = 0;
    for (const id of following.ids) {
      if (followers.ids.has(id)) total += 1;
    }
    return total;
  } catch {
    return undefined;
  }
}

function normalizeProfile(username: string, raw: unknown) {
  const source =
    first(raw, [["data", "user"], ["user"], ["userInfo", "user"], ["data"], []]) ?? raw;
  const stats = first(raw, [["data", "stats"], ["stats"], ["userInfo", "stats"]]);

  const profile = {
    username:
      asString(
        first(source, [
          ["uniqueId"],
          ["unique_id"],
          ["username"],
          ["secUid"],
          ["nickname"],
        ]),
      ) ?? username,
    displayName: asString(first(source, [["nickname"], ["displayName"], ["name"], ["full_name"]])),
    avatarUrl: asString(
      first(source, [
        ["avatarLarger"],
        ["avatarMedium"],
        ["avatarThumb"],
        ["avatar"],
        ["avatar_url"],
        ["profile_pic_url"],
      ]),
    ),
    bio: asString(first(source, [["signature"], ["bio"], ["description"]])),
    verified: asBoolean(first(source, [["verified"], ["is_verified"], ["blueVerified"]])),
    privateAccount: asBoolean(first(source, [["privateAccount"], ["is_private"], ["private"]])),
    region: asString(first(source, [["region"], ["country"], ["accountRegion"]])),
    language: asString(first(source, [["language"], ["lang"], ["accountLanguage"]])),
    accountLevel: asString(first(source, [["accountLevel"], ["level"], ["authorityStatus"]])),
    followers: asNumber(first(stats, [["followerCount"], ["followers"], ["fans"]])),
    following: asNumber(first(stats, [["followingCount"], ["following"]])),
    likes: asNumber(first(stats, [["heartCount"], ["diggCount"], ["likes"], ["total_favorited"]])),
    videos: asNumber(first(stats, [["videoCount"], ["videos"], ["aweme_count"]])),
    friends: asNumber(first(stats, [["friendCount"], ["friends"], ["mutualFriendCount"], ["mutual_friends"]])),
    createdAt: asString(first(source, [["createTime"], ["createdAt"], ["created_time"]])),
    updatedAt: asString(first(source, [["modifyTime"], ["updatedAt"], ["updated_time"]])),
    contactEmail: asString(first(source, [["email"], ["contactEmail"], ["bioEmail"]])),
    contactPhone: asString(first(source, [["phone"], ["mobile"], ["contactPhone"]])),
    profileUrl: `https://www.tiktok.com/@${username}`,
    raw: asRecord(source),
  };

  return profile;
}

function normalizeStories(raw: unknown) {
  const items = findArray(raw, ["stories", "storyList", "items", "aweme_list", "videos", "data"]);
  return items
    .filter(isRecord)
    .map((item, index) => ({
      id: asString(first(item, [["id"], ["aweme_id"], ["storyId"]])) ?? `story-${index + 1}`,
      caption: asString(first(item, [["desc"], ["caption"], ["title"]])),
      thumbnailUrl: asString(
        first(item, [
          ["cover"],
          ["origin_cover"],
          ["dynamic_cover"],
          ["thumbnail"],
          ["video", "cover"],
          ["video", "originCover"],
          ["image", "url"],
        ]),
      ),
      videoUrl: asString(
        first(item, [
          ["play"],
          ["wmplay"],
          ["videoUrl"],
          ["video", "playAddr"],
          ["video", "downloadAddr"],
        ]),
      ),
      createdAt: asString(first(item, [["createTime"], ["createdAt"], ["create_time"]])),
      views: asNumber(first(item, [["playCount"], ["play_count"], ["views"], ["statistics", "play_count"]])),
      likes: asNumber(first(item, [["diggCount"], ["digg_count"], ["likes"], ["statistics", "digg_count"]])),
      shares: asNumber(first(item, [["shareCount"], ["share_count"], ["shares"], ["statistics", "share_count"]])),
      comments: asNumber(first(item, [["commentCount"], ["comment_count"], ["comments"], ["statistics", "comment_count"]])),
      raw: item,
    }));
}

router.get("/tiktok/profile", async (req, res) => {
  const parsed = GetTikTokProfileQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid username", details: parsed.error.message });
    return;
  }

  const username = parsed.data.username.replace(/^@/, "").trim();
  const key = process.env.TIKTOK_SCRAPER_API_KEY ?? process.env.RAPIDAPI_KEY;
  const host = process.env.TIKTOK_SCRAPER_HOST ?? process.env.RAPIDAPI_HOST ?? DEFAULT_HOST;

  if (!key) {
    res.status(502).json({
      error: "TikTok Scraper API key is not configured",
      details: "Add TIKTOK_SCRAPER_API_KEY as a secret, then retry the search.",
    });
    return;
  }

  const encoded = encodeURIComponent(username);
  const profilePaths = [
    `/user/info?unique_id=${encoded}`,
    `/user/info?username=${encoded}`,
    `/user?unique_id=${encoded}`,
    `/user?username=${encoded}`,
  ];
  const storyPaths = [
    `/user/story?unique_id=${encoded}`,
    `/user/stories?unique_id=${encoded}`,
    `/user/stories?username=${encoded}`,
    `/stories?unique_id=${encoded}`,
    `/stories?username=${encoded}`,
  ];

  try {
    const profileRaw = await fetchFirstSuccessful(host, profilePaths, key, req.log);
    const userId = getUserId(profileRaw);
    if (userId) {
      storyPaths.splice(1, 0, `/user/story?user_id=${encodeURIComponent(userId)}`);
    }
    let storiesRaw: unknown = {};
    try {
      storiesRaw = await fetchAllPages(host, storyPaths, key, ["stories", "storyList", "items", "aweme_list", "videos", "data"], req.log);
    } catch (err) {
      req.log.warn({ err }, "TikTok story endpoints unavailable");
    }

    const profile = normalizeProfile(username, profileRaw);
    profile.friends = profile.friends ?? (await computeFriendCount(host, userId, key));
    const stories = normalizeStories(storiesRaw);
    const metrics = [
      { label: "المتابعون", value: profile.followers ?? null, available: profile.followers !== undefined },
      { label: "يتابع", value: profile.following ?? null, available: profile.following !== undefined },
      { label: "الإعجابات", value: profile.likes ?? null, available: profile.likes !== undefined },
      { label: "الفيديوهات", value: profile.videos ?? null, available: profile.videos !== undefined },
      { label: "الأصدقاء", value: profile.friends ?? null, available: profile.friends !== undefined },
    ];
    const flags = [
      { label: "حساب موثق", value: profile.verified ?? null, available: profile.verified !== undefined },
      {
        label: "حساب خاص",
        value: profile.privateAccount ?? null,
        available: profile.privateAccount !== undefined,
      },
      { label: "بيانات الستوري متاحة", value: stories.length > 0, available: true },
    ];
    const missingFields = [
      ["مشاهدات الستوري", stories.some((story) => story.views !== undefined)],
      ["إعجابات الستوري", stories.some((story) => story.likes !== undefined)],
    ]
      .filter(([, available]) => !available)
      .map(([label]) => String(label));

    const data = GetTikTokProfileResponse.parse({
      profile,
      stories,
      metrics,
      flags,
      source: host,
      generatedAt: new Date().toISOString(),
      missingFields,
      rawSummary: {
        profileKeys: isRecord(profileRaw) ? Object.keys(profileRaw).slice(0, 25) : [],
        storiesKeys: isRecord(storiesRaw) ? Object.keys(storiesRaw).slice(0, 25) : [],
      },
    });

    res.json(data);
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    req.log.warn({ err, username }, "TikTok lookup failed");
    res.status(502).json({ error: "TikTok Scraper lookup failed", details });
  }
});

/**
 * Parse a TikTok video URL and return { username, videoId }.
 * Supports:
 *   https://www.tiktok.com/@username/video/1234567890
 *   https://vm.tiktok.com/XXXXX/  (short link — no username available)
 */
function parseTikTokVideoUrl(input: string): { username?: string; videoId?: string } {
  const trimmed = input.trim();
  // plain numeric video ID
  if (/^\d{15,20}$/.test(trimmed)) return { videoId: trimmed };

  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    // full URL: tiktok.com/@username/video/123456789
    const fullMatch = parsed.pathname.match(/\/@([^/]+)\/video\/(\d+)/);
    if (fullMatch) return { username: fullMatch[1], videoId: fullMatch[2] };
    // just a video ID in path segments
    const idMatch = parsed.pathname.match(/\/(\d{15,20})/);
    if (idMatch) return { videoId: idMatch[1] };
  } catch {
    // not a valid URL, try regex
    const m = trimmed.match(/\/@([^/]+)\/video\/(\d+)/);
    if (m) return { username: m[1], videoId: m[2] };
  }
  return {};
}

/**
 * Resolve a short TikTok URL (vt.tiktok.com / vm.tiktok.com) to a full URL
 * by following the redirect without fetching the body.
 */
async function resolveShortUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    return res.url || url;
  } catch {
    return url;
  }
}

router.get("/tiktok/video", async (req, res) => {
  let rawUrl = typeof req.query["url"] === "string" ? req.query["url"].trim() : "";
  if (!rawUrl) {
    res.status(400).json({ error: "المعامل url مطلوب" });
    return;
  }

  const key = process.env.TIKTOK_SCRAPER_API_KEY ?? process.env.RAPIDAPI_KEY;
  const host = process.env.TIKTOK_SCRAPER_HOST ?? process.env.RAPIDAPI_HOST ?? DEFAULT_HOST;

  if (!key) {
    res.status(502).json({ error: "مفتاح API غير مضبوط" });
    return;
  }

  // Resolve short links (vt.tiktok.com, vm.tiktok.com)
  const isShort = /\/(vt|vm)\.tiktok\.com\//i.test(rawUrl) || /^https?:\/\/(vt|vm)\.tiktok\.com/i.test(rawUrl);
  if (isShort) {
    rawUrl = await resolveShortUrl(rawUrl);
  }

  const { username, videoId } = parseTikTokVideoUrl(rawUrl);

  if (!username && !videoId) {
    res.status(400).json({
      error: "رابط الفيديو غير صحيح",
      details: "يرجى استخدام الرابط الكامل: tiktok.com/@اسم_المستخدم/video/رقم_الفيديو",
    });
    return;
  }

  try {
    // Strategy: fetch user posts and find the matching video
    if (username && videoId) {
      const encoded = encodeURIComponent(username);
      let cursor: string | number | undefined;
      let found: UnknownRecord | undefined;

      // Search up to 5 pages (5 × 35 = 175 posts)
      for (let page = 0; page < 5 && !found; page++) {
        const path = withParams(`/user/posts?unique_id=${encoded}`, { count: 35, cursor });
        const raw = await fetchJson(host, path, key);
        const data = getDataRecord(raw);
        const videos = getItemsFromRaw(data, ["videos", "aweme_list", "items", "data"]);

        for (const v of videos) {
          const numericId = asString(v["video_id"]); // numeric ID, matches URL
          const awemeId = asString(v["aweme_id"]);   // may be non-numeric like v1504gf...
          if (
            numericId === videoId ||
            awemeId === videoId ||
            numericId?.endsWith(videoId) ||
            videoId.endsWith(numericId ?? "") ||
            awemeId?.endsWith(videoId) ||
            videoId.endsWith(awemeId ?? "")
          ) {
            found = v;
            break;
          }
        }

        const hasMore = asBoolean(data["hasMore"]) ?? asBoolean(data["has_more"]) ?? false;
        const nextCursor = asString(data["cursor"]) ?? asNumber(data["cursor"]);
        if (!hasMore || nextCursor === undefined || nextCursor === cursor) break;
        cursor = nextCursor;
      }

      if (found) {
        res.json({
          videoId,
          caption: asString(first(found, [["title"], ["content_desc"], ["desc"], ["caption"]])),
          author: asString(first(found, [["author", "unique_id"], ["author", "uniqueId"], ["author", "nickname"]])) ?? username,
          cover: asString(first(found, [["origin_cover"], ["cover"], ["ai_dynamic_cover"]])),
          views: asNumber(found["play_count"]) ?? null,
          likes: asNumber(found["digg_count"]) ?? null,
          comments: asNumber(found["comment_count"]) ?? null,
          shares: asNumber(found["share_count"]) ?? null,
          fetchedAt: new Date().toISOString(),
        });
        return;
      }

      // Video not found in posts — might be older; return what we know
      res.status(404).json({
        error: "الفيديو غير موجود",
        details: "لم يتم العثور على الفيديو في آخر 175 منشوراً للحساب. تأكد من صحة الرابط.",
      });
      return;
    }

    // Only videoId without username — try to get username from the resolved URL first
    res.status(400).json({
      error: "رابط الفيديو ناقص",
      details: "يرجى استخدام الرابط الكامل الذي يحتوي على اسم الحساب: tiktok.com/@اسم_المستخدم/video/رقم_الفيديو",
    });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    req.log.warn({ err, rawUrl }, "TikTok video lookup failed");
    res.status(502).json({ error: "فشل جلب بيانات الفيديو", details });
  }
});

export default router;