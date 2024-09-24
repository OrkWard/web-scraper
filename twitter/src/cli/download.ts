import * as path from "path";
import { pipeline } from "stream/promises";
import { createWriteStream, writeFileSync } from "fs";

import { HttpsProxyAgent } from "https-proxy-agent";
import fetch from "node-fetch";

const proxyAgent = new HttpsProxyAgent("http://asus:7890");

async function downloadRetry(url: string, retry: number = 3) {
  for (let attempt = 0; attempt < retry; attempt++) {
    try {
      const response = await fetch(url, { agent: proxyAgent });
      return response.body;
    } catch (err) {
      console.error(err);
    }
  }

  throw new Error("E> Download Error!");
}

export async function downloadAll(urls: string[], outputDir: string) {
  let i = 0;
  // handle sigint
  let aboutToExit = false;
  process.on("SIGINT", () => {
    saveProgress();
    aboutToExit = true;
  });

  function saveProgress() {
    console.log("|> Saving Progress...");
    writeFileSync(path.join(outputDir, "download.int"), urls.slice(i).join("\n"));
    console.log("|> About to exit...");
  }

  console.log("|> Starting download...");
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve(void 0);
    }, 3000);
  });

  for (; i < urls.length; i += 10) {
    if (aboutToExit) {
      process.exit(0);
    }
    await Promise.all(
      urls.slice(i, i + 10).map(async (u) => {
        const file = await downloadRetry(u);
        const outputPath = path.join(outputDir, u.slice(u.lastIndexOf("/") + 1));
        if (!file) {
          return;
        }

        return await pipeline(file, createWriteStream(outputPath.slice(0, outputPath.lastIndexOf("?"))));
      }),
    ).catch((e) => {
      console.error(e);
      saveProgress();
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });

    console.log(`  progress: ${i / urls.length}`);
  }
}
