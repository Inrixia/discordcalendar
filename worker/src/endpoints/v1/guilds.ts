import { Router } from "itty-router";
import { RouteBases, Routes } from "discord-api-types/v10";
import { parryResponse } from "@inrixia/cfworker-helpers";

import type { SRequest } from "../../types";

export const guilds = Router({ base: "/v1/guilds" });

guilds.get("/", async (req: SRequest) => {
	return parryResponse(fetch(`${RouteBases.api}/${Routes.userGuilds()}`, { headers: { Authorization: req.env.auth } }));
});
