import { Router } from "itty-router";
import { RESTGetAPICurrentUserGuildsResult, RouteBases, Routes } from "discord-api-types/v10";

import { fetchWithTimeout, genericResponse, jsonResponse } from "@inrixia/cfworker-helpers";
import { WorkerCache } from "../../WorkerCache";

import type { EnvInterface } from "../../types";

export const guilds = Router({ base: "/v1/guilds" });

type Guilds = Set<string>;
const fetchBotGuilds = (env: EnvInterface) => () =>
	fetchWithTimeout(`${RouteBases.api}/${Routes.userGuilds()}`, { headers: { Authorization: env.auth } })
		.then((res) => res.json<RESTGetAPICurrentUserGuildsResult>())
		.then((guilds) => new Set(guilds.map((guild) => guild.id)));

let guildsCache: WorkerCache<Guilds>;
guilds.get("/", async (req: Request, env: EnvInterface) => {
	const ids = new URL(req.url).searchParams.get("guildIds");
	if (ids === null) return genericResponse(400);

	// Init the cache if it doesn't exist
	if (guildsCache === undefined) guildsCache = new WorkerCache<Guilds>(fetchBotGuilds(env), 5000);

	const botGuilds = await guildsCache.get();
	return jsonResponse(ids.split(",").filter((id) => botGuilds.has(id)));
});
