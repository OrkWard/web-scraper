/** Start from index, parse first complete object */
export function parseJSONFromString(json: string, index: number) {
  if (index < 0 || index >= json.length) {
    throw new Error("[Partial Parse JSON] Invalid startIndex");
  }

  const leftBrace = json.indexOf("{", index);
  if (leftBrace === -1) {
    return null;
  }

  const stack: string[] = [];
  for (let i = leftBrace; i < json.length; i += 1) {
    switch (json[i]) {
      case "{":
        stack.push("{");
        break;
      case "}": {
        const last = stack.pop();
        // can't pair
        if (last !== "{") {
          return null;
        }

        // complete
        if (stack.length === 0) {
          return JSON.parse(json.slice(leftBrace, i + 1));
        }
        break;
      }
    }
  }
  return null;
}

export function filterOutDuplicateVideo(videoList: string[]) {
  const videoAttrList = videoList.map((v) => ({ id: v.match(/ext_tw_video\/(\d+)\//)![1], url: v }));
  const pickHighest = (vList: string[]) => {
    const resolutionList = vList.map((v) => {
      const vh = v.match(/\/(\d+)x(\d+)\//);
      // ignore m3u8
      if (!vh) return 0;
      const [_, w, h] = vh;
      return Number(w) * Number(h);
    });

    let highest = 0;
    for (let i = 1; i < vList.length; i += 1) {
      if (resolutionList[i] > resolutionList[0]) {
        highest = i;
      }
    }
    return vList[highest];
  };

  const filteredVideoList = Object.values(Object.groupBy(videoAttrList, ({ id }) => id)).map((sameVideos) =>
    pickHighest(sameVideos!.map((v) => v.url)),
  );

  return filteredVideoList;
}
