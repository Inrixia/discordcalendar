export type WCGenerator<Value> = () => Promise<Value> | Value;

export class WorkerCache<CacheValue> {
	private value: CacheValue | Promise<CacheValue>;

	private generator: WCGenerator<CacheValue>;
	private ttl: number;
	private deathDate: number;

	constructor(generator: WCGenerator<CacheValue>, ttl: number) {
		this.generator = generator;
		this.ttl = ttl;
		this.deathDate = Date.now();
		this.value = generator();
	}

	public get(reGenerate?: boolean) {
		if (reGenerate === true || this.deathDate < Date.now()) {
			this.value = this.generator();
			this.deathDate = Date.now() + this.ttl;
		}
		return this.value;
	}
}
