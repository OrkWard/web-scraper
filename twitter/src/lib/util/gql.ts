import { parse } from "acorn";
import { simple } from "acorn-walk";
import { getMain } from "../core/get-entry.js";

interface GQL {
  queryId: string;
  // operationName: string;
  // operationType: string;
  // metaData: {
  //   featureSwitches: string[];
  //   fieldToggles: string[];
  // };
}

export async function prepareGql() {
  const mainJs = await getMain();
  const ast = parse(mainJs, { locations: true, sourceType: "script", ecmaVersion: 2023 });
  return function getGraphql(funcName: string): GQL {
    let gql: GQL | null = null;

    simple(ast, {
      ObjectExpression(node) {
        if (
          node.properties.some(
            (p) =>
              p.type === "Property"
              && p.key.type === "Identifier"
              && p.key.name === "operationName"
              && p.value.type === "Literal"
              && p.value.value === funcName,
          )
        ) {
          const queryId = node.properties.find(
            (p) => p.type === "Property" && p.key.type === "Identifier" && p.key.name === "queryId",
          );

          if (
            queryId?.type === "Property"
            && queryId.value.type === "Literal"
            && typeof queryId.value.value === "string"
          ) {
            gql = { queryId: queryId.value.value };
          }
        }
      },
    });

    if (!gql) {
      throw new Error("gql not find");
    }

    return gql;
  };
}
