import { useEffect, useState } from "react";
import { useDiscordOAuth } from "./DiscordOAuthProvider";

import { Routes, RouteBases } from "discord-api-types/v9";
import { RESTGetAPIUserResult, RESTGetAPICurrentUserGuildsResult } from "discord-api-types/v10";

import { fetchWithTimeout } from "./helpers";

import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";

const localizer = momentLocalizer(moment);

export const Home = () => {
	const discordInfo = useDiscordOAuth();
	const headers = { Authorization: `${discordInfo.tokenType} ${discordInfo.accessToken}` };

	const [user, setUser] = useState<RESTGetAPIUserResult>();
	const [guilds, setGuilds] = useState<RESTGetAPICurrentUserGuildsResult>();

	useEffect(() => {
		// Fetch user
		fetchWithTimeout(`${RouteBases.api}/${Routes.user()}`, { headers })
			.then((result) => result.json<RESTGetAPIUserResult>())
			.then(console.log)
			.catch(console.error);

		fetchWithTimeout(`${RouteBases.api}/${Routes.userGuilds()}`, { headers })
			.then((result) => result.json<RESTGetAPICurrentUserGuildsResult>())
			.then(console.log)
			.catch(console.error);
	}, []);

	return (
		<>
			Hello {user?.username || "Loading"}, you are in {guilds?.length || "Loading"} guilds.
			<Calendar localizer={localizer} startAccessor="start" endAccessor="end" style={{ height: 500 }} />
		</>
	);
};
