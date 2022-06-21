import { RouteBases } from "discord-api-types/v9";

export const clientId = "986978606351786065";

export type ImageSize = 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
export type ImageFormat = "jpg" | "png" | "webp" | "gif";
export type CDNBase = "icons" | "emojis" | "avatars" | "app-icons" | "guild-events";

type ImgUrlParams = {
	id: string;
	hash: string;
	size?: ImageSize;
	format?: ImageFormat;
};
type ImgUrlParamsExtended = {
	id: string;
	hash: string;
	guildId: string;
	size?: ImageSize;
	format?: ImageFormat;
};
export function imgUrl(base: "guilds", params: ImgUrlParamsExtended): string;
export function imgUrl(base: CDNBase, params: ImgUrlParams): string;
export function imgUrl(
	base: "guilds" | CDNBase,
	{
		id,
		hash,
		// @ts-expect-error It complains about this not existing but its fine, we are overloading the function
		guildId,
		size,
		format,
	}: ImgUrlParamsExtended | ImgUrlParams
): string {
	if (format === undefined) format = "gif";
	if (size === undefined) size = 64;
	// In the case of endpoints that support GIFs, the hash will begin with a_ if it is available in GIF format.
	// If not default to webp
	if (!hash.startsWith("a_")) format = "webp";
	if (base === "guilds") return `${RouteBases.cdn}/${base}/${guildId}/users/${id}/avatars/${hash}.${format}`;
	return `${RouteBases.cdn}/${base}/${id}/${hash}.${format}?size=${size}`;
}

export const APIBase = "https://api.discordcalendar.com";
export const APIRoutes = {
	Guilds: "/v1/guilds",
	Events: "/v1/events",
} as const;

export const getLocalStorage = <S extends any>(key: string, defaultState: S): S => {
	const stateString = localStorage.getItem(key);
	if (stateString !== null) {
		try {
			defaultState = JSON.parse(stateString);
		} catch {}
	}
	return defaultState;
};

export const dividerFix = {
	"&::before": { position: "inherit" },
	"&::after": { position: "inherit" },
};
