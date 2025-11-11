import { writeFileSync } from "fs";
import { writeFile } from "fs/promises";
import * as path from "path";

import { get, sleep, GracefulShutdown } from "./utils.js";

const shutdown = new GracefulShutdown();

export async function downloadAll(urls: string[], outputDir: string) {
  let i = 0;

  console.log(`|> Start download, remaining ${urls.length}`);
  await sleep();

  try {
    for (; i < urls.length; i += 10) {
      if (shutdown.isExiting()) {
        console.log("Interrupted.");
        throw new Error();
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
        throw new Error();
      });

      console.log(`==> progress: ${(i + urls.slice(i, i + 10).length) / urls.length}`);
      await sleep(500);
    }
  } catch {
    console.log("|> Saving Progress...");
    writeFileSync(path.join(outputDir, "download.int"), urls.slice(i).join("\n"));
    console.log("|> About to exit...");
  }
}
