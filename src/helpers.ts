import { RouteBases } from "discord-api-types/v9";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type FetchType = typeof fetch;

type RateLimitType = {
	global: boolean;
	message: string;
	retry_after: number;
};

export const fetchWithTimeout = async (...args: Parameters<FetchType>): ReturnType<FetchType> => {
	const response = await fetch(...args);
	const { retry_after } = await response.clone().json<RateLimitType>();
	if (retry_after !== undefined) {
		await sleep(retry_after * 1000);
		return fetchWithTimeout(...args);
	}
	return response;
};
type ImageSize = 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
type ImageFormat = "jpg" | "png" | "webp" | "gif";
type CDNBase = "icons" | "emojis" | "avatars";

export const imgUrl = (base: CDNBase = "icons", id: string, hash: string, format: ImageFormat = "gif", size: ImageSize = 64): string => {
	// In the case of endpoints that support GIFs, the hash will begin with a_ if it is available in GIF format.
	// If not default to webp
	if (!hash.startsWith("a_")) format = "webp";
	return `${RouteBases.cdn}/${base}/${id}/${hash}.${format}?size=${size}`;
};
