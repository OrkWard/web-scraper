import got from "got";

const instance = got.extend({ mutableDefaults: true, headers: { "user-agent": "" } });
const authInstance = got.extend({ mutableDefaults: true });

export { authInstance, instance };
export const { get, post } = instance;
export const { get: authGet } = authInstance;
