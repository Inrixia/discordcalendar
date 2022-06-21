// Components
import { GuildIcon } from "./components/GuildIcon";

// Types
import type { Event as CalendarEvent } from "react-big-calendar";
import { UserGuild } from "./types";

export const buildCalendarObjects = (userGuilds: UserGuild[], onlyThisUser?: string) => {
	const guilds = userGuilds.filter((guild) => guild.events.length > 0);

	const events = guilds.flatMap((guild) =>
		(guild.events || [])
			.filter((event) => onlyThisUser === undefined || event.users.some((user) => user.user.id === onlyThisUser))
			.map(
				(event): CalendarEvent => ({
					title: (
						<div style={{ display: "flex" }}>
							<GuildIcon guild={guild} size={24} style={{ marginRight: 4 }} />
							{event.name}
						</div>
					),
					start: event.scheduled_start_time ? new Date(event.scheduled_start_time) : undefined,
					end: event.scheduled_end_time ? new Date(event.scheduled_end_time) : new Date(new Date(event.scheduled_start_time).getTime() + 1000 * 60 * 60),
					// @ts-expect-error Yea the types seem wrong for this, its resourceId. Also adding discordEventId here for convenience
					resourceId: guild.id,
					discordEvent: event,
					discordGuild: guild,
				})
			)
	);
	const resources = guilds.map((guild) => ({
		id: guild.id,
		name: (
			<div style={{ display: "flex" }}>
				<GuildIcon guild={guild} size={24} style={{ marginRight: 4 }} />
				{guild.name}
			</div>
		),
	}));

	return { events, resources };
};
