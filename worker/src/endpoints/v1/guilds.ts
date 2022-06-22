import { Router } from "itty-router";
import { RESTGetAPICurrentUserGuildsResult, RouteBases, Routes } from "discord-api-types/v10";

import { fetchWithTimeout, genericResponse, jsonResponse } from "@inrixia/cfworker-helpers";
import { WorkerCache } from "../../WorkerCache";

import type { EnvInterface } from "../../types";

export const guilds = Router({ base: "/v1/guilds" });

type Guilds = Record<string, 0>;
const fetchBotGuilds = (env: EnvInterface) => () =>
	fetchWithTimeout(`${RouteBases.api}/${Routes.userGuilds()}`, { headers: { Authorization: env.auth } })
		.then((res) => res.json<RESTGetAPICurrentUserGuildsResult>())
		.then((guilds) => guilds.reduce((guilds, guild) => ({ ...guilds, [guild.id]: 0 }), {}));

let guildsCache: WorkerCache<Guilds>;
guilds.get("/", async (req: Request, env: EnvInterface) => {
	const url = new URL(req.url);
	const ids = url.searchParams.get("guildIds");
	if (ids === null) return genericResponse(400);

	// Init the cache if it doesn't exist
	if (guildsCache === undefined) guildsCache = new WorkerCache<Guilds>(fetchBotGuilds(env), env.discordApiCache, "botGuilds");

	const botGuilds = await guildsCache.get();
	return jsonResponse(ids.split(",").filter((id) => botGuilds[id] !== undefined));
});
