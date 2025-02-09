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
