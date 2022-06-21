import { WCGenerator, WorkerCache } from "./WorkerCache";

export class WorkerLookupCache<CacheValue> {
	private lookup: Record<string, WorkerCache<CacheValue>> = {};

	public has(key: string): boolean {
		return this.lookup[key] !== undefined;
	}
	public set(key: string, generator: WCGenerator<CacheValue>, ttl: number, regenCooldown?: number) {
		this.lookup[key] = new WorkerCache(generator, ttl, regenCooldown);
	}
	public async get(key: string, reGenerate?: boolean) {
		return this.lookup[key].get(reGenerate);
	}
}
