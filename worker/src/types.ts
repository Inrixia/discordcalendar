import type { Request as ittyRquest } from "itty-router";

export interface EnvInterface {
	spawnTime: number;
	ENVIRONMENT: string;

	// Secrets
	token: string;

	// Discord API
	auth: string;
}

export const JWKUMK = "https://safetyabilitytests.com/user";

export type SRequest = Request & ittyRquest & { env: EnvInterface };
