import { Router } from "itty-router";
import { RESTGetAPICurrentUserGuildsResult, RouteBases, Routes } from "discord-api-types/v10";

import { fetchWithTimeout } from "@inrixia/cfworker-helpers";

import type { SRequest } from "../../types";

export const guilds = Router({ base: "/v1/guilds" });

guilds.get("/", async (req: SRequest) => {
	const guilds = await fetchWithTimeout(`${RouteBases.api}/${Routes.userGuilds()}`, { headers: { Authorization: req.env.auth } })
		.then((res) => res.json<RESTGetAPICurrentUserGuildsResult>())
		.then((botGuilds) =>
			botGuilds.reduce((guilds, guild) => {
				guilds[guild.id] = 0;
				return guilds;
			}, {} as Record<string, 0>)
		);

	return new Response(JSON.stringify(guilds));
});
