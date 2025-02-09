import got from "got";

const instance = got.extend({ mutableDefaults: true });
const authInstance = got.extend({ mutableDefaults: true });

export { instance, authInstance };
export const { get } = instance;
export const { get: authGet } = authInstance;
