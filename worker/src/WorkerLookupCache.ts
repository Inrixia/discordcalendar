import { WCGenerator, WorkerCache } from "./WorkerCache";

export class WorkerLookupCache<CacheValue> {
	private lookup: Record<string, WorkerCache<CacheValue>> = {};

	private ttl: number;

	private kv: KVNamespace;
	private kvPrefix: string;

	/**
	 * Worker Lookup Cache
	 * @param kv Keyvault Namespace to use for caching
	 * @param kvPrefix Prefix to use for this specific lookup cache in the Keyvault Namespace
	 * @param ttl Time to cache for in seconds, this must be greater than 60.
	 */
	constructor(kv: KVNamespace, kvPrefix: string, ttl: number = 60) {
		this.kv = kv;
		this.kvPrefix = kvPrefix;
		this.ttl = ttl >= 60 ? ttl : 60;
	}

	public has(key: string): boolean {
		return this.lookup[key] !== undefined;
	}
	public set(key: string, generator: WCGenerator<CacheValue>) {
		this.lookup[key] = new WorkerCache(generator, this.kv, `${this.kvPrefix}/${key}`, this.ttl);
	}
	public async get(key: string) {
		return this.lookup[key].get();
	}
}
