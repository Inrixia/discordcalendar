import { Router } from "itty-router";

import { genericResponse, OPTIONS, patchResponse } from "@inrixia/cfworker-helpers";
import { v1 } from "./endpoints/v1";

// Types
import { type EnvInterface, SRequest } from "./types";
const router = Router();

router
	.options("*", OPTIONS)
	.all("/v1/*", v1.handle)
	// 404 for everything else
	.all("*", () => genericResponse(404));

export default {
	fetch: async (request: SRequest, env: EnvInterface) => {
		env.auth = `Bot ${env.token}`;
		request.env = env;
		try {
			return patchResponse(await router.handle(request));
		} catch (err) {
			return genericResponse(500, <Error>err);
		}
	},
};
