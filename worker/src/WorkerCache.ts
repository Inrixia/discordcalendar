export type WCGenerator<Value> = () => Promise<Value> | Value;

export class WorkerCache<CacheValue> {
	private generator: WCGenerator<CacheValue>;

	public ttl: number;
	public regenCooldown?: number;

	private kv: KVNamespace;
	private key: string;

	constructor(generator: WCGenerator<CacheValue>, kv: KVNamespace, key: string, ttl: number = 60) {
		this.generator = generator;
		this.ttl = ttl;
		this.kv = kv;
		this.key = key;
	}

	public async get() {
		const kvValue = await this.kv.get<CacheValue>(this.key, "json");
		if (kvValue !== null) return kvValue;

		const newValue = await this.generator();
		await this.kv.put(this.key, JSON.stringify(newValue), { expirationTtl: this.ttl });
		return newValue;
	}
}
