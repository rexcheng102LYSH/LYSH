/**
 * Resource Pack Downloader
 * [Alpha 0.7.9.8] 用户触发的资源预下载功能
 *
 * 功能说明：
 * - 注册 Service Worker (sw.js) 用于缓存静态资源
 * - 提供用户触发的资源预下载入口 (downloadGameAssets)
 * - 显示下载进度UI（环形进度条 + 箭头填充动画）
 * - 支持 file:// 协议检测并提示用户使用正确入口
 *
 * 依赖：
 * - sw.js: Service Worker，处理 Cache API 缓存
 * - style.css: .resource-download-btn 相关样式
 *
 * @see AGENTS_CONTEXT.md - 前端启动流程
 */
(function () {
  const RESOURCE_LIST = [
    "images/maple.png",
    "images/sun.png",
    "images/ice.png",
    "images/fire.png",
    "images/gold.png",
    "images/pebble.png",
    "images/starfish.png",
    "images/scallop.png",
    "images/bottle.png",
    "bgm1.mp3",
    "bgm2.mp3",
    "bgm3.mp3",
    "bgm4.mp3",
    "bgm5.mp3",
    "bgm6.mp3",
    "bgm7.mp3",
    "bgs1.mp3",
    "shot.m4a"
  ];
  const RESOURCE_TOTAL_MB = "49.6";
  const RESOURCE_CACHE = "lysh-user-pack-v1";

  let swRegisterPromise = null;
  let prefetching = false;
  let lastProgress = 0;
  let fileModeBlocked = false;

  const ui = {
    button: null,
    ring: null,
    arrowFillRect: null,
    ringLength: 0
  };

  function toast(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }
    console.log("[ResourcePack]", message);
  }

  function isFileProtocol() {
    return typeof window !== "undefined" && window.location.protocol === "file:";
  }

  function initDownloadButtonUI() {
    ui.button = document.getElementById("resourceDownloadBtn");
    ui.ring = document.getElementById("resourceProgressRing");
    ui.arrowFillRect = document.getElementById("resourceArrowFillRect");
    if (ui.ring && typeof ui.ring.getTotalLength === "function") {
      ui.ringLength = ui.ring.getTotalLength();
    } else {
      ui.ringLength = Math.PI * 2 * 20;
    }
    updateDownloadButtonProgress(0, "idle");

    fileModeBlocked = isFileProtocol();
    if (ui.button && fileModeBlocked) {
      ui.button.title = "请使用 http://localhost:3000 或线上地址进入游戏";
    }
  }

  function updateDownloadButtonProgress(progress, mode) {
    if (!ui.button || !ui.ring || !ui.arrowFillRect) return;

    const p = Math.max(0, Math.min(1, Number(progress) || 0));
    lastProgress = p;

    const ringFill = ui.ringLength * p;
    ui.ring.style.strokeDasharray = `${ringFill} ${ui.ringLength}`;
    ui.ring.style.strokeLinecap = p > 0 ? "round" : "butt";

    const fillTop = 10;
    const fillHeightMax = 24;
    const fillHeight = fillHeightMax * p;
    const fillY = fillTop;
    ui.arrowFillRect.setAttribute("y", String(fillY));
    ui.arrowFillRect.setAttribute("height", String(fillHeight));

    if (mode === "downloading") {
      ui.button.classList.add("is-downloading");
      ui.button.classList.remove("is-ready");
    } else if (mode === "ready") {
      ui.button.classList.remove("is-downloading");
      ui.button.classList.add("is-ready");
    } else {
      ui.button.classList.remove("is-downloading");
      ui.button.classList.remove("is-ready");
    }

    if (mode === "idle") {
      ui.ring.style.opacity = "0";
    } else {
      ui.ring.style.opacity = "1";
    }

    if (p >= 1) {
      ui.button.title = "资源已完全下载";
    } else if (mode === "idle") {
      ui.button.title = "下载本地资源";
    } else {
      ui.button.title = `下载本地资源 (${Math.round(p * 100)}%)`;
    }
  }

  function canUseServiceWorker() {
    return (
      "serviceWorker" in navigator &&
      typeof window !== "undefined" &&
      /^https?:$/i.test(window.location.protocol)
    );
  }

  async function registerServiceWorker() {
    if (!canUseServiceWorker()) return null;
    if (swRegisterPromise) return swRegisterPromise;

    swRegisterPromise = navigator.serviceWorker
      .register("sw.js", { updateViaCache: "none" })
      .then(() => navigator.serviceWorker.ready)
      .catch((err) => {
        console.warn("[ResourcePack] Service Worker 注册失败:", err);
        return null;
      });

    return swRegisterPromise;
  }

  function getCacheRequest(url) {
    const absoluteUrl = new URL(url, window.location.origin);
    absoluteUrl.search = "";
    absoluteUrl.hash = "";
    return new Request(absoluteUrl.toString(), { method: "GET" });
  }

  async function detectCachedProgress() {
    if (!("caches" in window)) return 0;
    try {
      const cache = await caches.open(RESOURCE_CACHE);
      let ok = 0;
      for (const url of RESOURCE_LIST) {
        const hit = await cache.match(getCacheRequest(url));
        if (hit) ok += 1;
      }
      return RESOURCE_LIST.length > 0 ? ok / RESOURCE_LIST.length : 0;
    } catch (_) {
      return 0;
    }
  }

  async function syncButtonStateFromCache() {
    const progress = await detectCachedProgress();
    if (progress >= 1) {
      updateDownloadButtonProgress(1, "ready");
      return;
    }
    updateDownloadButtonProgress(0, "idle");
  }

  async function getActiveWorker() {
    const reg = await registerServiceWorker();
    if (!reg) return null;
    return reg.active || reg.waiting || reg.installing || null;
  }

  async function prefetchByServiceWorker(onProgress) {
    const worker = await getActiveWorker();
    if (!worker) return false;

    return new Promise((resolve) => {
      const channel = new MessageChannel();
      let settled = false;

      const cleanup = () => {
        if (!settled) {
          settled = true;
          channel.port1.close();
        }
      };

      const timeout = setTimeout(() => {
        cleanup();
        resolve(false);
      }, 45000);

      channel.port1.onmessage = (ev) => {
        const data = ev.data || {};
        if (data.type === "PREFETCH_PROGRESS") {
          const ok = Number(data.ok || 0);
          const total = Number(data.total || 0);
          if (typeof onProgress === "function" && total > 0) {
            onProgress(ok / total);
          }
          return;
        }
        if (data.type === "PREFETCH_DONE") {
          clearTimeout(timeout);
          cleanup();
          const ok = Number(data.ok || 0);
          const failed = Number(data.failed || 0);
          const total = Number(data.total || 0);
          if (ok > 0 && failed === 0) {
            toast("资源已完全下载");
          } else if (ok > 0) {
            toast(`资源下载部分完成：成功 ${ok}，失败 ${failed}`);
          } else {
            toast("资源下载失败，请稍后重试。");
          }
          resolve(total > 0 && ok === total && failed === 0);
        }
      };

      worker.postMessage(
        {
          type: "PREFETCH_RESOURCES",
          urls: RESOURCE_LIST
        },
        [channel.port2]
      );
    });
  }

  async function prefetchByHttpCacheFallback(onProgress) {
    let ok = 0;
    let done = 0;
    const total = RESOURCE_LIST.length;
    for (const url of RESOURCE_LIST) {
      try {
        const resp = await fetch(url, { cache: "reload" });
        if (resp && resp.ok) ok += 1;
      } catch (_) {}
      done += 1;
      if (typeof onProgress === "function" && total > 0) {
        onProgress(ok / total);
      }
    }
    return total > 0 && ok === total;
  }

  async function downloadGameAssets() {
    if (fileModeBlocked) {
      alert(
        "主人，当前是 file:// 模式，下载功能暂不可用哦。\n\n项目已进入线上测试阶段，请不要直接打开 index.html。\n请使用以下地址进入游戏：\n本地测试：http://localhost:3000\n线上测试：https://lysh-server.zeabur.app"
      );
      return;
    }

    if (prefetching) {
      toast("资源下载进行中，请稍候。");
      return;
    }

    const cachedProgress = await detectCachedProgress();
    if (cachedProgress >= 1) {
      updateDownloadButtonProgress(1, "ready");
      toast("资源已完全下载");
      return;
    }

    if (lastProgress >= 1) {
      toast("资源已完全下载");
      return;
    }

    const allow = window.confirm(
      `是否下载本地资源包？\n资源大小：${RESOURCE_TOTAL_MB} MB`
    );
    if (!allow) return;

    prefetching = true;
    updateDownloadButtonProgress(0, "downloading");
    toast("开始下载资源，请稍候...");

    try {
      let success = await prefetchByServiceWorker((progress) => {
        updateDownloadButtonProgress(progress, "downloading");
      });
      if (!success) {
        success = await prefetchByHttpCacheFallback((progress) => {
          updateDownloadButtonProgress(progress, "downloading");
        });
      }
      if (success) {
        updateDownloadButtonProgress(1, "ready");
      } else {
        updateDownloadButtonProgress(0, "idle");
        toast("资源下载失败，请检查网络后重试。");
      }
    } finally {
      prefetching = false;
    }
  }

  window.downloadGameAssets = downloadGameAssets;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initDownloadButtonUI();
      registerServiceWorker();
      syncButtonStateFromCache();
    });
  } else {
    initDownloadButtonUI();
    registerServiceWorker();
    syncButtonStateFromCache();
  }
})();
