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
	fetchWithTimeout(`${RouteBases.api}/${Routes.guildScheduledEventUsers(guildId, eventId)}?with_member=true`, { headers: { Authorization } }).then((res) =>
		res.json<EventUsers>()
	);

let eventsCache: WorkerLookupCache<Events>;
let eventUserCache: WorkerLookupCache<EventUsers>;
events.get("/", async (req: Request, env: EnvInterface) => {
	const url = new URL(req.url);
	const guildId = url.searchParams.get("guildId");
	if (guildId === null) return genericResponse(400);

	// Init cache
	if (eventsCache === undefined) eventsCache = new WorkerLookupCache<Events>(env.discordApiCache, "guildEvents");
	if (!eventsCache.has(guildId)) eventsCache.set(guildId, getEvents(guildId, env.auth));

	// Optional params
	const noUsers = url.searchParams.get("noUsers") !== null;
	const forceRefresh = url.searchParams.get("forceRefresh") !== null;

	// Fetch guild events
	const guildEvents = await eventsCache.get(guildId);

	if (noUsers) return jsonResponse(guildEvents);
	if (eventUserCache === undefined) eventUserCache = new WorkerLookupCache<EventUsers>(env.discordApiCache, "eventUsers");

	// Fetch the users for each event
	return jsonResponse(
		await Promise.all(
			guildEvents.map(async (event) => {
				const cacheId = `${event.guild_id}/${event.id}`;
				if (!eventUserCache.has(cacheId)) eventUserCache.set(cacheId, getEventUsers(event.guild_id, event.id, env.auth));
				return { ...event, users: await eventUserCache.get(cacheId) };
			})
		)
	);
});
