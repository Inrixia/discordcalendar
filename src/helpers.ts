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
