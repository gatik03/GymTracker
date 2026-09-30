/* eslint-disable @typescript-eslint/no-require-imports */
// Visual QA for the Phase 2A login. Usage:
//   node scripts/login-visual-debug.cjs [outDir] [baseUrl]
// Captures the skip destination at every acceptance viewport, the full intro
// timeline at desktop and mobile, and reports overflow, console errors and the
// stack/login geometry so screenshots can be inspected afterwards.
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("/home/gatik7k/.local/lib/node_modules/@playwright/test");

const outDir = process.argv[2] || "/tmp/gymtracker-login";
const baseUrl = process.argv[3] || "http://localhost:3000";

const viewports = [
  [360, 800],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1440, 900],
  [1920, 1080],
];
const timelineViewports = [
  [1440, 900],
  [390, 844],
];
const timelineMs = [100, 600, 1000, 1250, 1500, 1800, 2100, 2350, 2600, 2900, 3150, 3400, 3650, 3900, 4150, 4400, 4650, 4900, 5150];

function watch(page) {
  const log = { errors: [], warnings: [], failed: [] };
  page.on("console", (message) => {
    if (message.type() === "error") log.errors.push(message.text());
    if (message.type() === "warning") log.warnings.push(message.text());
  });
  page.on("pageerror", (error) => log.errors.push(`pageerror: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 400) log.failed.push(`${response.status()} ${response.url()}`);
  });
  return log;
}

async function measure(page) {
  return page.evaluate(() => {
    const box = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) };
    };
    return {
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      stack: box("[data-plate-stack-slot]"),
      console: box(".login-console"),
      rows: Array.from(document.querySelectorAll(".login-row")).map((row) => Math.round(row.getBoundingClientRect().height)),
      canvas: box("canvas"),
      focused: document.activeElement ? document.activeElement.id || document.activeElement.tagName : null,
    };
  });
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const report = { skip: {}, timeline: {} };

  for (const [width, height] of viewports) {
    const page = await browser.newPage({ viewport: { width, height } });
    const log = watch(page);
    await page.goto(`${baseUrl}/login?intro=skip`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(outDir, `skip-${width}x${height}.png`) });
    await page.screenshot({ path: path.join(outDir, `skip-${width}x${height}-full.png`), fullPage: true });
    report.skip[`${width}x${height}`] = { ...(await measure(page)), ...log };
    await page.close();
  }

  for (const [width, height] of timelineViewports) {
    // Real-time pass: the intro must play through to READY on its own.
    const live = await browser.newPage({ viewport: { width, height } });
    const liveLog = watch(live);
    const started = Date.now();
    await live.goto(`${baseUrl}/login?intro=debug`, { waitUntil: "domcontentloaded" });
    await live.waitForFunction(() => /phase: READY/.test(document.body.innerText), null, { timeout: 60000 });
    const playedMs = Date.now() - started;
    await live.waitForTimeout(1200);
    await live.screenshot({ path: path.join(outDir, `played-${width}x${height}.png`) });
    const played = { wallClockMs: playedMs, overlay: (await live.evaluate(() => document.querySelector("pre")?.innerText ?? "")).replace(/\n/g, " | "), final: await measure(live), ...liveLog };
    await live.close();

    // Frozen frames: ?intro=debug&at=<seconds> pauses the timeline at an exact
    // time, so each screenshot is a true timeline checkpoint.
    const frames = [];
    for (const ms of timelineMs) {
      const page = await browser.newPage({ viewport: { width, height } });
      await page.goto(`${baseUrl}/login?intro=debug&at=${ms / 1000}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1200);
      const overlay = await page.evaluate(() => document.querySelector("pre")?.innerText ?? "");
      await page.screenshot({ path: path.join(outDir, `timeline-${width}x${height}-${String(ms).padStart(4, "0")}ms.png`) });
      frames.push(overlay.replace(/\n/g, " | "));
      await page.close();
    }
    report.timeline[`${width}x${height}`] = { played, frames };
  }

  await browser.close();
  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})();
