/**
 * Service Worker for Resource Pack Caching
 * [Alpha 0.7.9.8] 静态资源缓存与预下载支持
 *
 * 功能说明：
 * - 拦截匹配的静态资源请求（images/*, *.mp3, *.m4a等）
 * - 使用 Cache API 实现缓存优先策略
 * - 支持 MessageChannel 触发的资源预下载
 *
 * 缓存版本说明：
 * - RESOURCE_CACHE = "lysh-user-pack-v1" 为缓存版本标识
 * - 更新资源时需修改此版本号以触发缓存更新
 * - @see AGENTS_CONTEXT.md 记录当前缓存版本
 *
 * 消息协议：
 * - 入站: { type: 'PREFETCH_RESOURCES', urls: string[] }
 * - 出站: { type: 'PREFETCH_PROGRESS', done, ok, total }
 * - 出站: { type: 'PREFETCH_DONE', ok, failed, total }
 */
const RESOURCE_CACHE = "lysh-user-pack-v1";
const CACHEABLE_EXT_RE = /\.(?:png|jpg|jpeg|webp|gif|svg|mp3|m4a|wav|ogg)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function isCacheableAsset(requestUrl) {
  if (requestUrl.origin !== self.location.origin) return false;
  if (requestUrl.pathname.startsWith("/images/")) return true;
  return CACHEABLE_EXT_RE.test(requestUrl.pathname);
}

function toCacheKey(request) {
  const normalizedUrl = new URL(request.url);
  normalizedUrl.search = "";
  normalizedUrl.hash = "";
  return new Request(normalizedUrl.toString(), { method: "GET" });
}

async function cacheFetchAndStore(request) {
  const cache = await caches.open(RESOURCE_CACHE);
  const cacheKey = toCacheKey(request);
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const networkResponse = await fetch(request);
  if (networkResponse && networkResponse.ok && networkResponse.type === "basic") {
    await cache.put(cacheKey, networkResponse.clone());
  }
  return networkResponse;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  if (request.headers.has("range")) return;

  const requestUrl = new URL(request.url);
  if (!isCacheableAsset(requestUrl)) return;

  event.respondWith(cacheFetchAndStore(request));
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "PREFETCH_RESOURCES") return;

  const urls = Array.isArray(data.urls) ? data.urls : [];
  event.waitUntil(
    (async () => {
      const cache = await caches.open(RESOURCE_CACHE);
      const results = {
        type: "PREFETCH_DONE",
        total: urls.length,
        ok: 0,
        failed: 0
      };
      let done = 0;

      function reportProgress() {
        const replyPort = event.ports && event.ports[0];
        if (!replyPort) return;
        replyPort.postMessage({
          type: "PREFETCH_PROGRESS",
          done,
          ok: results.ok,
          total: urls.length
        });
      }

      for (const rawUrl of urls) {
        try {
          const absoluteUrl = new URL(rawUrl, self.location.origin).toString();
          const req = new Request(absoluteUrl, { method: "GET" });
          const cacheKey = toCacheKey(req);
          const existing = await cache.match(cacheKey);
          if (existing) {
            results.ok += 1;
            done += 1;
            reportProgress();
            continue;
          }
          const resp = await fetch(req);
          if (!resp || !resp.ok || resp.type !== "basic") {
            results.failed += 1;
            done += 1;
            reportProgress();
            continue;
          }
          await cache.put(cacheKey, resp.clone());
          results.ok += 1;
          done += 1;
          reportProgress();
        } catch (_) {
          results.failed += 1;
          done += 1;
          reportProgress();
        }
      }

      const replyPort = event.ports && event.ports[0];
      if (replyPort) {
        replyPort.postMessage(results);
      }
    })()
  );
});
