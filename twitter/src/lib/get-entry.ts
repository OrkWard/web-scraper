import * as cheerio from "cheerio";
import { get } from "./request.js";

/** parce main.xxx.js from x.com */
async function prepareEntry() {
  const entry$ = cheerio.load(await get("https://x.com/home").text());
  const [_, migrate] =
    entry$("script")
      .text()
      .match(/"(http.*)"/) || [];
  if (!migrate) {
    console.warn("[Prepare] script not found in `https://x.com/home`");
    return undefined;
  }
  const migrate$ = cheerio.load(await get(migrate).text());
  const srcList: string[] = [];
  migrate$("script").each((i, script) => {
    srcList.push(script.attribs["src"] || "");
  });
  const main = srcList.find((src) => src.match(/main\..*\.js/));
  if (!main) {
    console.warn(`[Prepare] main script not found in ${migrate}`);
  }
  return main;
}

/** fetch main.xxx.js */
export async function getMain() {
  return await get((await prepareEntry()) || "https://abs.twimg.com/responsive-web/client-web/main.855db29a.js").text();
}
