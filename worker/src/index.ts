import { Router } from "itty-router";

import { genericResponse, OPTIONS, patchResponse } from "@inrixia/cfworker-helpers";
import { v1 } from "./endpoints/v1";

// Types
import { type EnvInterface } from "./types";
const router = Router();

router
	.options("*", OPTIONS)
	.all("/v1/*", v1.handle)
	// 404 for everything else
	.all("*", () => genericResponse(404));

export default {
	fetch: async (request: Request, env: EnvInterface) => {
		env.auth = `Bot ${env.token}`;
		try {
			return patchResponse(await router.handle(request, env));
		} catch (err) {
			return genericResponse(500, <Error>err);
		}
	},
};
