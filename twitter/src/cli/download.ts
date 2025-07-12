import { writeFileSync } from "fs";
import { writeFile } from "fs/promises";
import got from "got";
import { HttpsProxyAgent } from "https-proxy-agent";
import * as path from "path";

const proxyEnv = process.env.https_proxy || process.env.all_rpoxy;
const proxyAgent = proxyEnv ? new HttpsProxyAgent(proxyEnv) : undefined;

function handleSIGINT(callback?: () => void) {
  let aboutToExit = false;
  process.on("SIGINT", () => {
    callback?.();
    aboutToExit = true;
  });

  return () => {
    return aboutToExit;
  };
}

async function sleep(time: number = 1000) {
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve(void 0);
    }, time);
  });
}

export async function downloadAll(urls: string[], outputDir: string) {
  /** download progress */
  let i = 0;
  function saveProgress() {
    console.log("|> Saving Progress...");
    writeFileSync(path.join(outputDir, "download.int"), urls.slice(i).join("\n"));
    console.log("|> About to exit...");
  }

  const existing = handleSIGINT(saveProgress);

  console.log(`|> Start download, remaining ${urls.length}`);
  await sleep();

  for (; i < urls.length; i += 10) {
    if (existing()) {
      process.exit(0);
    }
    await Promise.all(
      urls.slice(i, i + 10).map(async (u) => {
        const file = await got(u, { agent: { https: proxyAgent } }).buffer();
        if (!file) {
          return;
        }
        const p = new URL(u).pathname;
        const outputPath = path.join(outputDir, p.slice(p.lastIndexOf("/") + 1));

        return writeFile(outputPath, file);
      }),
    ).catch((e) => {
      console.error(e);
      saveProgress();
      process.exit(0);
    });

    console.log(`  progress: ${(i + urls.slice(i, i + 10).length) / urls.length}`);
    await sleep(500);
  }
}
