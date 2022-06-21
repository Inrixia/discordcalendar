import { Router } from "itty-router";
import {
	RouteBases,
	Routes,
	RESTGetAPIGuildScheduledEventsResult as Events,
	RESTGetAPIGuildScheduledEventUsersResult as EventUsers,
} from "discord-api-types/v10";

import { fetchWithTimeout, genericResponse, jsonResponse } from "@inrixia/cfworker-helpers";

import type { EnvInterface } from "../../types";
import { WorkerLookupCache } from "../../WorkerLookupCache";

export const events = Router({ base: "/v1/events" });

const getEvents = (guildId: string, Authorization: string) => () =>
	fetchWithTimeout(`${RouteBases.api}/${Routes.guildScheduledEvents(guildId)}`, { headers: { Authorization } }).then((res) => res.json<Events>());

const getEventUsers = (guildId: string, eventId: string, Authorization: string) => () =>
	fetchWithTimeout(`${RouteBases.api}/${Routes.guildScheduledEventUsers(guildId, eventId)}`, { headers: { Authorization } }).then((res) =>
		res.json<EventUsers>()
	);

let eventsCache: WorkerLookupCache<Events>;
events.get("/", async (req: Request, env: EnvInterface) => {
	const guildId = new URL(req.url).searchParams.get("guildId");
	if (guildId === null) return genericResponse(400);

	if (eventsCache === undefined) eventsCache = new WorkerLookupCache<Events>();

	if (!eventsCache.has(guildId)) eventsCache.set(guildId, getEvents(guildId, env.auth), 30000);

	return jsonResponse(await eventsCache.get(guildId));
});

let eventUserCache: WorkerLookupCache<EventUsers>;
events.get("/users", async (req: Request, env: EnvInterface) => {
	const url = new URL(req.url);
	const guildId = url.searchParams.get("guildId");
	const eventId = url.searchParams.get("eventId");
	if (guildId === null || eventId === null) return genericResponse(400);

	if (eventUserCache === undefined) eventUserCache = new WorkerLookupCache<EventUsers>();

	const cacheId = `${guildId}${eventId}`;
	if (!eventUserCache.has(cacheId)) eventUserCache.set(cacheId, getEventUsers(guildId, eventId, env.auth), 30000);

	return jsonResponse(await eventUserCache.get(cacheId));
});
