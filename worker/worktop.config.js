import { define } from "worktop.build";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";

export default define({
	modify(config) {
		config.plugins = config.plugins || [];
		config.plugins.push(NodeModulesPolyfillPlugin());
	},
});
