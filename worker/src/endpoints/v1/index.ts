import { Router } from "itty-router";

import { guilds } from "./guilds";
import { events } from "./events";

export const v1 = Router({ base: "/v1" }).all("/guilds/*", guilds.handle).all("/events/*", events.handle);
