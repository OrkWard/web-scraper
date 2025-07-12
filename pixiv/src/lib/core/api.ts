import { omit } from "es-toolkit";
import got from "got";

interface BookmarkRequest {
  tag: string;
  offset: string;
  limit: string;
  user: string;
}

interface BookmarkResponse {
  error: boolean;
  message: string;
  body: {
    works: Array<Work>;
    total: number;
  };
}

export interface Work {
  id: string; // 作品 id
  title: string; // 作品名
  userId: string; // 作者 id
  userName: string; // 作者名
}

interface NovelRequest {
  novel: string;
}

interface NovelResponse {
  error: boolean;
  message: string;
  body: {
    content: string;
    title: string;
    uploadDate: string;
  };
}

export async function fetchBookmark(
  req: BookmarkRequest,
  headers: Record<string, string>,
): Promise<BookmarkResponse> {
  const res = await got(
    `https://www.pixiv.net/ajax/user/${req.user}/novels/bookmarks?${new URLSearchParams({
      ...omit(req, ["user"]),
      lang: "zh",
      rest: "show",
    })}`,
    {
      headers,
      responseType: "json",
    },
  );

  console.log(`|> target: ${res.url}`);

  return res.body as BookmarkResponse;
}

export async function fetchNovel(
  req: NovelRequest,
  headers: Record<string, string>,
): Promise<NovelResponse> {
  const res = await got(`https://www.pixiv.net/ajax/novel/${req.novel}?lang=zh`, {
    headers,
    responseType: "json",
  });
  return res.body as NovelResponse;
}
