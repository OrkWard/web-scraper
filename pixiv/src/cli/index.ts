import * as fs from "node:fs";
import * as path from "node:path";
import meow from "meow";
import { fetchBookmark, fetchNovel } from "../lib/core/api.js";

const cli = meow(
  `
  Usage
    $ pixiv-scraper <user_id>

  Options
    --tag, -t      Filter by tag (default: "")
    --limit, -l    Number of works to fetch per page (default: 30)
    --offset, -o   Starting offset (default: 0)
    --output, -d   Output directory (default: "./output")

  Examples
    $ pixiv-scraper 15771408
    $ pixiv-scraper 15771408 --tag "novel" --limit 50 --output ./downloads
`,
  {
    importMeta: import.meta,
    flags: {
      tag: {
        type: "string",
        shortFlag: "t",
        default: "",
      },
      limit: {
        type: "number",
        shortFlag: "l",
        default: 30,
      },
      offset: {
        type: "number",
        shortFlag: "o",
        default: 0,
      },
      output: {
        type: "string",
        shortFlag: "d",
        default: "./output",
      },
    },
  },
);

const user = cli.input[0];
const { output: outputDir, limit, tag, offset: startOffset } = cli.flags;

// must have a input user id
if (!user) {
  cli.showHelp();
  process.exit(1);
}

// make sure output dir exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const headers = {
  cookie: process.env.cookie,
  "User-Agent": process.env.userAgent,
};
let offset = startOffset;
while (true) {
  const {
    body: { works, total },
  } = await fetchBookmark(
    { user, tag, offset: offset.toString(), limit: limit.toString() },
    headers,
  );

  await Promise.all(
    works.map(async (n) => {
      const {
        body: { content, title },
      } = await fetchNovel({ novel: n.id }, headers);
      await fs.promises.writeFile(path.join(outputDir, title + ".txt"), content);
    }),
  );
  console.log(`|> Progress: ${offset + works.length}/${total}`);
  // hit final page
  if (works.length < limit) {
    break;
  }

  // wait a second before next batch
  await new Promise((resolve) => {
    setTimeout(() => resolve(undefined), 1000);
  });
  offset += limit;
}
