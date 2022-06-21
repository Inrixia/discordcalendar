export type WCGenerator<Value> = () => Promise<Value> | Value;

export class WorkerCache<CacheValue> {
	private value: CacheValue | Promise<CacheValue>;

	private generator: WCGenerator<CacheValue>;
	private ttl: number;
	private deathDate: number;
	private regenCooldown?: number;
	private regenDate: number;

	constructor(generator: WCGenerator<CacheValue>, ttl: number, regenCooldown?: number) {
		this.generator = generator;
		this.ttl = ttl;
		this.deathDate = 0;
		this.value = generator();
		this.regenCooldown = regenCooldown;
		this.regenDate = 0;
	}

	public get(reGenerate?: boolean) {
		// If requesting to regen, dont allow to do so if still on cooldown
		if (this.regenCooldown !== undefined && reGenerate) {
			if (this.regenDate > Date.now()) reGenerate = false;
			else this.regenDate = Date.now() + this.regenCooldown;
		}
		if (reGenerate === true || this.deathDate < Date.now()) {
			this.value = this.generator();
			this.deathDate = Date.now() + this.ttl;
		}
		return this.value;
	}
}
