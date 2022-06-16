import { RouteBases } from "discord-api-types/v9";

export type ImageSize = 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
export type ImageFormat = "jpg" | "png" | "webp" | "gif";
export type CDNBase = "icons" | "emojis" | "avatars" | "app-icons";

export const imgUrl = (base: CDNBase = "icons", id: string, hash: string, size: ImageSize = 64, format: ImageFormat = "gif"): string => {
	// In the case of endpoints that support GIFs, the hash will begin with a_ if it is available in GIF format.
	// If not default to webp
	if (!hash.startsWith("a_")) format = "webp";
	return `${RouteBases.cdn}/${base}/${id}/${hash}.${format}?size=${size}`;
};

export const APIBase = "https://api.discordcalendar.com";
export const APIRoutes = {
	Guilds: "/v1/guilds",
	Events: "/v1/events",
} as const;
