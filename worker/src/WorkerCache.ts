export class WorkerCache<CacheValue> {
	private value?: CacheValue;

	private generator: () => Promise<CacheValue> | CacheValue;
	private ttl: number;
	private deathDate: number;

	constructor(generator: () => Promise<CacheValue> | CacheValue, ttl: number) {
		this.generator = generator;
		this.ttl = ttl;
		this.deathDate = Date.now();
	}

	public async get(reGenerate?: boolean) {
		if (reGenerate === true || this.ttl < Date.now()) {
			this.value = await this.generator();
			this.deathDate = Date.now() + this.ttl;
		}
		return this.value!;
	}
}
