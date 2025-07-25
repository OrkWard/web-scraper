import { writeFileSync } from "fs";
import { writeFile } from "fs/promises";
import * as path from "path";

import { get, sleep } from "./utils.js";

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
        const file = await get(u).buffer();
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
