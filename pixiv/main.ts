import { fetchBookmark, fetchNovel } from "./api.ts";
import * as fs from "@std/fs";
import * as path from "@std/path";

if (import.meta.main) {
  // params
  const user = "15771408";
  const tag = "";
  const limit = 30;
  let offset = 0;

  const outputPath = "./output";
  if (!fs.existsSync(outputPath)) {
    await Deno.mkdir(outputPath);
  }

  while (true) {
    const res = await fetchBookmark({
      user,
      tag,
      offset: offset.toString(),
      limit: limit.toString(),
    });

    await Promise.all(
      res.body.works.map(async (n) => {
        const res = await fetchNovel({ novel: n.id });
        await Deno.writeTextFile(
          path.join(outputPath, res.body.title + ".txt"),
          res.body.content
        );
      })
    );

    console.log(
      `|> Progress: ${offset + res.body.works.length}/${res.body.total}`
    );

    if (res.body.works.length < limit) {
      break;
    }

    await new Promise((resolve) => {
      setTimeout(() => resolve(undefined), 1000);
    });

    offset += limit;
  }
}
