import type {
	RESTAPIPartialCurrentUserGuild as Guild,
	RESTGetAPIGuildScheduledEventsResult as Events,
	RESTGetAPIGuildScheduledEventUsersResult as EventUsers,
} from "discord-api-types/v10";
import type { ValueOfA } from "@inrixia/helpers/ts";

export type Event = ValueOfA<Events> & { users: EventUsers };

export type UserGuild = Guild & { calendarBotIsIn: boolean; selected: boolean; events: Event[] };
export type UserGuilds = Record<string, UserGuild>;
