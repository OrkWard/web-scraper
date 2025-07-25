import got from "got";
import { HttpsProxyAgent } from "https-proxy-agent";

export async function sleep(time: number = 1000) {
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve(void 0);
    }, time);
  });
}

const proxyEnv = process.env.https_proxy || process.env.all_rpoxy;
const proxyAgent = proxyEnv ? new HttpsProxyAgent(proxyEnv) : undefined;

export const instance = got.extend({ agent: { https: proxyAgent } });
export const { get } = instance;
