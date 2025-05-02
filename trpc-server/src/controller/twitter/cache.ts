import { getUserId } from "./api.js";

export class UserIdStore {
  private _map = new Map<string, string>();

  constructor() {}
  async get(username: string) {
    if (!this._map.has(username)) {
      const id = await getUserId("blue_archivejp");
      this._map.set(username, id);
      return id;
    }

    return this._map.get(username)!;
  }
}
