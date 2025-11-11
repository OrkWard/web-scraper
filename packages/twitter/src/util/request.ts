import got from "got";
import { HttpsProxyAgent } from "https-proxy-agent";

const instance = got.extend({ mutableDefaults: true, headers: { "user-agent": "" } });
const authInstance = got.extend({ mutableDefaults: true });

const proxyEnv = process.env.https_proxy || process.env.all_rpoxy;
const proxyAgent = proxyEnv ? new HttpsProxyAgent(proxyEnv) : undefined;
if (proxyAgent) {
  instance.defaults.options.merge({ agent: { https: proxyAgent } });
  authInstance.defaults.options.merge({ agent: { https: proxyAgent } });
}

export { authInstance, instance };
export const { get, post } = instance;
export const { get: authGet } = authInstance;
