import { omit } from "@es-toolkit/es-toolkit";
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

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0";

const options = {
  method: "GET",
  headers: {
    cookie:
      "first_visit_datetime_pc=2024-09-17%2000%3A01%3A32; p_ab_id=5; p_ab_id_2=8; p_ab_d_id=1203324856; yuid_b=kIgyBxA; PHPSESSID=15771408_mzKtQLP5tQxdSQ4oI8Vj5A4fji53T68y; device_token=ffd6136366687bcf29bb2ac86327bdd5; privacy_policy_agreement=7; c_type=22; privacy_policy_notification=0; a_type=0; b_type=1; __cf_bm=RjN4qlZfoMov93faad8tDTvz6mCEqy0demEWJWVT5Ww-1727847981-1.0.1.1-macaZ2LEQzkWfE2RD43AzZvRZ7.QkslixkIHhbafHJUb2XNGn7SIR.v93lNWEIm5yTgUANJOvickMId30pHWjlBKFWYqyiIEdZ1hR3_5g2U; cf_clearance=YTlI.f17LQf8cRRT1SyeCG51j5qGWb15qKNGqx.eKvA-1727848049-1.2.1.1-yfep_9lkJwlQ19THepIcc9OLB1z7SdjOv8owkaG9ZaNXnwDmCioTqINWmEhyM4smTvGTzgogPtxWiN1QIP5pN_v_kT_cgL9.heQtQ_7RwvWThyo7fSuYy8Tr4g27dfNMq9W4pHTlQPcA8VPK.E4r9L0kP466H7SXSYaFzqDZcDQgIatgZDMeTkhnVW1EqdNX_PQFjbOCxXTQ8MXUgQBfVbfuZQC5LOJv119zSy.ecASZnccl3ROxM2r9u0cv2U5gjVH.jp1ltyk9WVFeKf.Ut_ar7XkEbyb8fuTJCgv8TCU060KYFUtGmWgAmo77cTm0I4NpcOzfE99auA.gb.PzmwHKzV4UYmqjrbPBxBB8QNSBDKNeWiGIpk1M3rhPQZmxIrEc0RVOHX5SomJ8v_IQlw",
    "User-Agent": UA,
  },
};

export async function fetchBookmark(
  req: BookmarkRequest
): Promise<BookmarkResponse> {
  const res = await fetch(
    `https://www.pixiv.net/ajax/user/${
      req.user
    }/novels/bookmarks?${new URLSearchParams({
      ...omit(req, ["user"]),
      lang: "zh",
      rest: "show",
    })}`,
    options
  );

  console.log(`|> target: ${res.url}`);

  return await res.json();
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

export async function fetchNovel(req: NovelRequest): Promise<NovelResponse> {
  const res = await fetch(
    `https://www.pixiv.net/ajax/novel/${req.novel}?lang=zh`,
    options
  );
  return await res.json();
}
