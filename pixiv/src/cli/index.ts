import * as fs from "node:fs";
import * as path from "node:path";
import meow from "meow";
import { fetchBookmark, fetchNovel } from "../lib/core/api.js";
import { config } from "./config.js";

const cli = meow(`
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
`, {
  importMeta: import.meta,
  flags: {
    tag: {
      type: 'string',
      shortFlag: 't',
      default: ''
    },
    limit: {
      type: 'number',
      shortFlag: 'l',
      default: 30
    },
    offset: {
      type: 'number',
      shortFlag: 'o',
      default: 0
    },
    output: {
      type: 'string',
      shortFlag: 'd',
      default: './output'
    }
  }
});

async function downloadPixivNovels(
  user: string, 
  options?: { tag?: string; limit?: number; offset?: number; outputDir?: string }
) {
  const { tag = "", limit = 30, offset: startOffset = 0, outputDir = "./output" } = options || {};
  
  const headers = {
    cookie: config.cookie,
    "User-Agent": config.userAgent,
  };

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let offset = startOffset;

  while (true) {
    const res = await fetchBookmark({
      user,
      tag,
      offset: offset.toString(),
      limit: limit.toString(),
    }, headers);

    await Promise.all(
      res.body.works.map(async (n) => {
        const res = await fetchNovel({ novel: n.id }, headers);
        await fs.promises.writeFile(
          path.join(outputDir, res.body.title + ".txt"),
          res.body.content,
        );
      }),
    );

    console.log(
      `|> Progress: ${offset + res.body.works.length}/${res.body.total}`,
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

const user = cli.input[0];

if (!user) {
  cli.showHelp();
  process.exit(1);
}

downloadPixivNovels(user, {
  tag: cli.flags.tag,
  limit: cli.flags.limit,
  offset: cli.flags.offset,
  outputDir: cli.flags.output
});