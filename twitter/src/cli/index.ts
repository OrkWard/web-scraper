import { existsSync } from "fs";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

import { prepareAPI } from "../lib/core/api.js";
import C from "./config.json" with { type: "json" };
import { downloadAll } from "./download.js";

// cli entry
async function getUserAllMedia(
  user: string,
  options?: { videoOnly?: boolean; imageOnly?: boolean; limit?: number },
) {
  const { getUserId, getUserMedia } = await prepareAPI({
    cookie: C.cookie,
    referer: `https://x.com/${user}/media`,
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "x-csrf-token": C["x-csrf-token"],
    Authorization: C.Authorization,
  });

  const outputDir = path.join(process.cwd(), "output", user);

  const userId = await getUserId(user);

  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  const interrupt = path.join(outputDir, "download.int");
  if (existsSync(interrupt)) {
    console.log("|> Unfinished download task detected");
    const urls = await readFile(interrupt, "utf8");
    await downloadAll(urls.split("\n"), outputDir).then(() => {
      unlink(interrupt);
    });
    return;
  }

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

    if (videos.length + imgs.length > (options?.limit ?? Infinity)) {
      break;
    }
  } while (nonEmpty);

  console.log("|> Save metadata...");
  await writeFile(path.join(outputDir, "all_image.json"), JSON.stringify(imgs, null, 2));
  await writeFile(path.join(outputDir, "all_video.json"), JSON.stringify(videos, null, 2));

  const resources: string[] = [];
  if (!options?.videoOnly) {
    resources.push(...imgs.map((m) => m + "?name=large"));
  }

  if (!options?.imageOnly) {
    resources.push(...videos);
  }

  await downloadAll(resources, outputDir);
}

function parseCli(argv: string[]) {
  let name = undefined;
  let videoOnly = false;
  let imageOnly = false;
  let limit = Infinity;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i][0] === "-") {
      switch (argv[i][1]) {
        case "v":
          if (imageOnly) {
            console.error("-v can't be use with -i");
            process.exit(1);
          }
          videoOnly = true;
          break;
        case "i":
          if (videoOnly) {
            console.error("-v can't be use with -i");
            process.exit(1);
          }
          imageOnly = true;
          break;
        case "l":
          if (!Number.isFinite(Number(argv[i + 1]))) {
            console.error("non-valid number detected");
          }
          limit = Number(argv[i + 1]);
          i += 1;
          break;
        default:
          console.warn("unknown argument detected, ignore for now");
          break;
      }
    } else {
      name = argv[i];
    }
  }

  if (!name) {
    console.error("need username");
    process.exit(1);
  }
  getUserAllMedia(name, { imageOnly, videoOnly, limit });
}

parseCli(process.argv.slice(2));
