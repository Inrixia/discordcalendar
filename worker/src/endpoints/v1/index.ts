import { Router } from "itty-router";

import { guilds } from "./guilds";

export const v1 = Router({ base: "/v1" }).all("/guilds/*", guilds.handle);
