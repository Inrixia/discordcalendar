import { useEffect, useReducer, useState } from "react";
import { useDiscordOAuth } from "./components/DiscordOAuthProvider";

import {
	Routes,
	RouteBases,
	RESTAPIPartialCurrentUserGuild as Guild,
	RESTGetAPICurrentUserGuildsResult as Guilds,
	RESTGetAPIGuildScheduledEventsResult as Events,
} from "discord-api-types/v10";

import { APIBase, APIRoutes } from "./helpers";
import { fetchWithTimeout } from "@inrixia/cfworker-helpers";

import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, momentLocalizer, Event as CalendarEvent } from "react-big-calendar";
import moment from "moment";
import { Divider, Grid, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { getDrawerHelpers } from "./components/Drawer";

// Icons
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

// CSS
import "./darkcalendar.scss";
import { UserProfile } from "./components/UserProfile";
import { GuildIcon } from "./components/GuildIcon";
import { GuildModal } from "./components/GuildModal";

const localizer = momentLocalizer(moment);
const { Drawer } = getDrawerHelpers(256);

type UserGuild = Guild & { calendarBotIsIn: boolean; selected: boolean; events: Events };
type UserGuilds = Record<string, UserGuild>;

const makeEventsUrl = (guildIds: string[]) => {
	const eventsUrl = new URL(`${APIBase}/${APIRoutes.Events}`);
	eventsUrl.searchParams.append("guildIds", guildIds.join(","));
	return eventsUrl.href;
};

// const missingGuilds = Array.from(selectedGuilds).filter((id) => events[id] === undefined);
// if (missingGuilds.length === 0) return;
//
//
// // Fetch guild events

type GuildEvents = Record<string, Events>;

type GuildsReducerActions =
	| { do: "set"; guilds: UserGuilds }
	| { do: "unselect"; id: string }
	| { do: "select"; id: string; events: Events }
	| { do: "updateEvents"; events: GuildEvents };
const guildsReducer = (state: UserGuilds, action: GuildsReducerActions) => {
	switch (action.do) {
		case "set":
			return setGuildsState(action.guilds);
		case "unselect":
			return setGuildsState({ ...state, [action.id]: { ...state[action.id], selected: false, events: [] } });
		case "select":
			return setGuildsState({ ...state, [action.id]: { ...state[action.id], events: action.events, selected: true } });
		case "updateEvents":
			const newState = { ...state };
			for (const id in action.events) newState[id].events = action.events[id];
			return setGuildsState(newState);
		default:
			throw new Error("No action specified for guildReducer!");
	}
};

const getGuildsState = () => {
	let guildsState: UserGuilds = {};
	let guildsStateString = localStorage.getItem("guilds");
	if (guildsStateString !== null) {
		try {
			guildsState = JSON.parse(guildsStateString);
		} catch {}
	}
	return guildsState;
};
const setGuildsState = (guilds: UserGuilds): UserGuilds => {
	localStorage.setItem("guilds", JSON.stringify(guilds));
	return guilds;
};

const buildCalendarEvents = (guilds: UserGuilds) =>
	Object.values(guilds).flatMap((guild) =>
		(guild.events || []).map(
			(event): CalendarEvent => ({
				title: (
					<div style={{ display: "flex" }}>
						<GuildIcon guild={guild} size={24} style={{ marginRight: 4 }} />
						{event.name}
					</div>
				),
				start: event.scheduled_start_time ? new Date(event.scheduled_start_time) : undefined,
				end: event.scheduled_end_time ? new Date(event.scheduled_end_time) : new Date(new Date(event.scheduled_start_time).getTime() + 1000 * 60 * 30),
			})
		)
	);

export const Home = () => {
	const { headers } = useDiscordOAuth();

	const [guilds, dispatchGuilds] = useReducer(guildsReducer, getGuildsState());

	// Viewstates
	const [drawerOpen, setDrawerOpen] = useState(false);

	const [modalOpen, setModalOpen] = useState(false);
	const [modalGuild, setModalGuild] = useState<Guild>();

	const updateSelectedGuildEvents = () => {
		fetch(makeEventsUrl(Object.keys(guilds).filter((id) => guilds[id].selected)))
			.then((result) => result.json<GuildEvents>())
			.then((events) => dispatchGuilds({ do: "updateEvents", events }));
	};

	const init = async () => {
		// Fetch user guilds
		const userGuilds = await fetchWithTimeout(`${RouteBases.api}/${Routes.userGuilds()}`, { headers }).then((result) => result.json<Guilds>());

		const botGuildsUrl = new URL(`${APIBase}/${APIRoutes.Guilds}`);
		botGuildsUrl.searchParams.append("guildIds", userGuilds.map((guild) => guild.id).join(","));
		// Fetch bot guilds
		const botGuilds = await fetch(botGuildsUrl.href)
			.then((result) => result.json<string[]>())
			.then((result) => new Set(result));

		const _guilds: UserGuilds = {};

		for (const guild of userGuilds) {
			const calendarBotIsIn = botGuilds.has(guild.id);
			if (!calendarBotIsIn) _guilds[guild.id] = { ...guild, calendarBotIsIn, selected: false, events: [] };
			else {
				const selected = guilds[guild.id]?.selected || false;
				const events = guilds[guild.id]?.events || [];
				_guilds[guild.id] = { ...guild, calendarBotIsIn, selected, events };
			}
		}
		dispatchGuilds({ do: "set", guilds: _guilds });
		updateSelectedGuildEvents();
	};

	useEffect(() => {
		init();
	}, []);

	const onSelect = (guild: UserGuild) => {
		// If guild is being unselected just dispatch
		if (guild.selected) dispatchGuilds({ do: "unselect", id: guild.id });
		// If its being selected but the bot is not in that guild then prompt to add
		else if (!guild.calendarBotIsIn) {
			setModalGuild(guild);
			setModalOpen(true);
			// If its being selected and the bot is in that guild then fetch events for that guild
		} else {
			fetch(makeEventsUrl([guild.id]))
				.then((result) => result.json<GuildEvents>())
				.then((events) => dispatchGuilds({ do: "select", id: guild.id, events: events[guild.id] }));
		}
	};

	return (
		<div style={{ display: "flex" }}>
			<Drawer variant="permanent" open={drawerOpen} PaperProps={{ style: { background: "#202225" } }}>
				{drawerOpen ? (
					<div
						style={{
							display: "flex",
							alignItems: "left",
							flexWrap: "wrap",
							whiteSpace: "nowrap",
						}}
					>
						<div style={{ overflow: "hidden", maxHeight: 64 }}>
							<IconButton onClick={() => setDrawerOpen(false)}>
								<ChevronLeftIcon />
							</IconButton>
							<span
								style={{
									textTransform: "uppercase",
									fontWeight: "bold",
									fontSize: 12,
									letterSpacing: "1px",
									textAlign: "center",
									margin: "auto",
									marginLeft: 16,
								}}
							>
								Discord Calendar
							</span>
						</div>
					</div>
				) : (
					<IconButton onClick={() => setDrawerOpen(true)}>
						<MenuIcon />
					</IconButton>
				)}
				<Divider />
				<List>
					<ListItem>
						<UserProfile />
					</ListItem>
				</List>
				<Divider />
				<List style={{ width: 256 }}>
					{Object.values(guilds).map((guild) => (
						<ListItemButton key={guild.id} onClick={() => onSelect(guild)} selected={guild.selected} dense>
							<GuildIcon guild={guild} style={{ marginRight: 16 }} />
							<ListItemText id={guild.id} primary={guild.name} />
						</ListItemButton>
					))}
					<Divider />
				</List>
			</Drawer>
			<GuildModal
				modalOpen={modalOpen}
				onClose={(refresh) => {
					setModalOpen(false);
					if (refresh) init();
				}}
				guild={modalGuild}
			/>
			<Calendar
				dayLayoutAlgorithm="overlap"
				localizer={localizer}
				events={buildCalendarEvents(guilds)}
				startAccessor="start"
				endAccessor="end"
				popup
				style={{ height: "100vh", width: "100%", padding: 16 }}
			/>
		</div>
	);
};
