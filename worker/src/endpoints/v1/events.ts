import { Router } from "itty-router";
import { RouteBases, Routes, RESTGetAPIGuildScheduledEventsResult as Events } from "discord-api-types/v10";

import { fetchWithTimeout, genericResponse, jsonResponse } from "@inrixia/cfworker-helpers";

import type { EnvInterface } from "../../types";
import { WorkerLookupCache } from "../../WorkerLookupCache";

export const events = Router({ base: "/v1/events" });

const getEvents = (guildId: string, Authorization: string) => () =>
	fetchWithTimeout(`${RouteBases.api}/${Routes.guildScheduledEvents(guildId)}`, { headers: { Authorization } }).then((res) => res.json<Events>());

let eventsCache = new WorkerLookupCache<Events>();
events.get("/", async (req: Request, env: EnvInterface) => {
	const ids = new URL(req.url).searchParams.get("guildIds");
	if (ids === null) return genericResponse(400);

	const guildEvents = await Promise.all(
		ids.split(",").map(async (id) => {
			if (!eventsCache.has(id)) eventsCache.set(id, getEvents(id, env.auth), 5000);
			return { [id]: await eventsCache.get(id) };
		})
	);

	return jsonResponse(guildEvents.reduce((guilds, guild) => ({ ...guilds, ...guild })));
});
