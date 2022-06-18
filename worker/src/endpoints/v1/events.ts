import { Router } from "itty-router";
import { RouteBases, Routes, RESTGetAPIGuildScheduledEventsResult } from "discord-api-types/v10";

import { fetchWithTimeout, genericResponse, jsonResponse } from "@inrixia/cfworker-helpers";

import type { EnvInterface } from "../../types";

export const events = Router({ base: "/v1/events" });

const getEvents = async (guildId: string, auth: string) =>
	fetchWithTimeout(`${RouteBases.api}/${Routes.guildScheduledEvents(guildId)}`, { headers: { Authorization: auth } }).then((res) =>
		res.json<RESTGetAPIGuildScheduledEventsResult>()
	);

events.get("/", async (req: Request, env: EnvInterface) => {
	const ids = new URL(req.url).searchParams.get("guildIds");
	if (ids === null) return genericResponse(400);

	const guildEvents = await Promise.all(ids.split(",").flatMap(async (id) => ({ [id]: await getEvents(id, env.auth) })));
	// Flatmap to compact into a single array
	return jsonResponse(guildEvents.reduce((guilds, guild) => ({ ...guilds, ...guild })));
});
