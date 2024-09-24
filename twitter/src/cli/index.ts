import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import _ from "lodash";
import "dotenv/config";
import "node-fetch";

import { prepareAPI } from "../lib/api.js";
import { downloadAll } from "./download.js";
import assert from "assert";
import { HttpsProxyAgent } from "https-proxy-agent";

const proxyEnv = process.env.https_proxy || process.env.all_rpoxy;
const proxyAgent = proxyEnv ? new HttpsProxyAgent(proxyEnv) : undefined;

// cli entry
async function getUserAllMedia(user: string, options?: { videoOnly?: boolean; imageOnly?: boolean; limit?: number }) {
  assert(process.env.cookie);
  assert(process.env["x-csrf-token"]);
  assert(process.env.Authorization);

  const { getUserId, getUserMedia } = await prepareAPI({
    agent: { https: proxyAgent },
    headers: {
      cookie: process.env.cookie,
      referer: `https://x.com/${user}/media`,
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      "x-csrf-token": process.env["x-csrf-token"],
      Authorization: process.env.Authorization,
    },
    followRedirect: true,
  });

  let bottom: string | undefined = undefined;
  let haveMore: boolean = true;
  const imgList: string[] = [];
  const videoList: string[] = [];

  const outputDir = path.join(process.cwd(), "output", user);

  const userId = await getUserId(user);

  if (!existsSync(outputDir)) {
    await fs.mkdir(outputDir, { recursive: true });
  }

  if (existsSync(path.join(outputDir, "download.int"))) {
    console.log("|> Unfinished download task detected");
    const urls = await fs.readFile(path.join(outputDir, "download.int"), "utf8");
    downloadAll(urls.split("\n"), outputDir);
    return;
  }

  do {
    const result = await getUserMedia(userId, bottom);
    console.log(result);
    bottom = result.cursor;
    haveMore = result.imgList.length > 0 || result.videoList.length > 0;
    imgList.push(...result.imgList);
    videoList.push(...result.videoList);

    if (videoList.length + imgList.length > (options?.limit ?? Infinity)) {
      break;
    }
  } while (haveMore);

  await fs.writeFile(path.join(outputDir, "all_image.json"), JSON.stringify(imgList, null, 2));
  await fs.writeFile(path.join(outputDir, "all_video.json"), JSON.stringify(videoList, null, 2));

  if (!options?.videoOnly) {
    await downloadAll(
      imgList.map((m) => m + "?name=large"),
      outputDir,
    );
  }

  if (!options?.imageOnly) {
    await downloadAll(videoList, outputDir);
  }
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
