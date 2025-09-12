import { existsSync } from "fs";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import * as o from "@optique/core";
import { run } from "@optique/run";

import { prepareAPI } from "../index.js";
import { downloadAll } from "./download.js";

// ========== parse flags =============
const parser = o.object({
  noVideo: o.flag(),
  noImage: o.flag(),
  maxCount: o.option("-l", "--count", o.integer()),
  userName: o.argument(o.string({ metavar: "twitter_user_name" })),
});
const result = run(parser);
const { userName: user, maxCount: limit } = result;

// ========== user info =============
const { getUserId, getUserMedia } = await prepareAPI({
  cookie: process.env.cookie,
  referer: `https://x.com/${user}/media`,
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "x-csrf-token": process.env.X_CSRF_TOKEN,
  Authorization: process.env.Authorization,
});
const userId = await getUserId(user);

// ========== try continue last interrupt ===========
const outputDir = await prepareOutputDir(user);
await tryContinueDownload(outputDir);

// ========== get and save meta file ==========
const [imgs, videos] = await getAllResource(userId);
console.log("|> Save metadata...");
await writeFile(path.join(outputDir, "all_image.json"), JSON.stringify(imgs, null, 2));
await writeFile(path.join(outputDir, "all_video.json"), JSON.stringify(videos, null, 2));

// ========= download files ==========
if (!result.noImage) {
  await downloadAll(imgs, outputDir);
}

if (!result.noVideo) {
  await downloadAll(videos, outputDir);
}

// ========== functions ==========
async function getAllResource(userId: string) {
  const imgs: string[] = [];
  const videos: string[] = [];

  let bottom: string | undefined = undefined;
  let nonEmpty: boolean = true;
  do {
    const result = await getUserMedia(userId, bottom);
    bottom = result.cursor;
    nonEmpty = result.imgs.length > 0 || result.videos.length > 0;
    imgs.push(...result.imgs);
    videos.push(...result.videos);

    if (videos.length + imgs.length > (limit ?? Infinity)) {
      break;
    }
  } while (nonEmpty);

  return [imgs.map((m) => m + "?name=large"), videos];
}

async function prepareOutputDir(user: string) {
  const outputDir = path.join(process.cwd(), "output", user);
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  return outputDir;
}

async function tryContinueDownload(outputDir: string) {
  const interrupt = path.join(outputDir, "download.int");
  if (existsSync(interrupt)) {
    console.log("|> Unfinished download task detected");
    const urls = await readFile(interrupt, "utf8");
    await downloadAll(urls.split("\n"), outputDir).then(() => {
      unlink(interrupt);
    });
    process.exit(0);
  }
}
