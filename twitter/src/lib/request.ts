import got from "got";

const instance = got.extend({ mutableDefaults: true });

export { instance };
export const { get, post } = instance;
