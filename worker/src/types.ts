import type { Request as ittyRquest } from "itty-router";

export interface EnvInterface {
	spawnTime: number;
	ENVIRONMENT: string;

	// Secrets
	token: string;

	// Discord API
	auth: string;

	// Keyvaults
	discordApiCache: KVNamespace;
}

export const JWKUMK = "https://safetyabilitytests.com/user";
