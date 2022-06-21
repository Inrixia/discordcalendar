import { useEffect, useReducer, useState } from "react";
import { useDiscordOAuth } from "./components/DiscordOAuthProvider";

import {
	Routes,
	RouteBases,
	RESTAPIPartialCurrentUserGuild as Guild,
	RESTGetAPICurrentUserGuildsResult as Guilds,
	RESTGetAPIGuildScheduledEventsResult as Events,
} from "discord-api-types/v10";

import { APIBase, APIRoutes, getLocalStorage } from "./helpers";
import { fetchWithTimeout } from "@inrixia/cfworker-helpers";

import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, momentLocalizer, Event as CalendarEvent } from "react-big-calendar";
import moment from "moment";
import { Checkbox, Divider, FormControlLabel, List, ListItemButton, ListItemText, Tooltip } from "@mui/material";
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

type GuildEvents = Record<string, Events>;

type GuildsReducerAction =
	| { do: "set"; guilds: UserGuilds }
	| { do: "unselect"; id: string }
	| { do: "select"; id: string; events: Events }
	| { do: "updateEvents"; id: string; events: Events };
const guildsReducer = (state: UserGuilds, action: GuildsReducerAction) => {
	switch (action.do) {
		case "set":
			return setGuildsState(action.guilds);
		case "unselect":
			return setGuildsState({ ...state, [action.id]: { ...state[action.id], selected: false, events: [] } });
		case "select":
			return setGuildsState({ ...state, [action.id]: { ...state[action.id], events: action.events, selected: true } });
		case "updateEvents":
			return setGuildsState({ ...state, [action.id]: { ...state[action.id], events: action.events } });
		default:
			throw new Error("No action specified for guildReducer!");
	}
};
const cleanOldState = (guildsState: UserGuilds) => {
	for (const id in guildsState) {
		// Reset events on unselected guilds
		if (!guildsState[id].selected) guildsState[id].events = [];
	}
	return guildsState;
};
const setGuildsState = (guilds: UserGuilds): UserGuilds => {
	localStorage.setItem("guilds", JSON.stringify(guilds));
	return guilds;
};

type Options = {
	onlyInterested: boolean;
};
type OptionsReducerAction = { do: "toggleOnlyInterested" };
const optionsReducer = (state: Options, action: OptionsReducerAction) => {
	switch (action.do) {
		case "toggleOnlyInterested":
			return { ...state, onlyInterested: !state.onlyInterested };
		default:
			throw new Error("No action specified for optionsReducer!");
	}
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
				end: event.scheduled_end_time ? new Date(event.scheduled_end_time) : new Date(new Date(event.scheduled_start_time).getTime() + 1000 * 60 * 60),
				// @ts-expect-error Yea the types seem wrong for this, its resourceId. Also adding discordEventId here for convenience
				resourceId: guild.id,
				discordEventId: event.id,
			})
		)
	);

const buildCalendarResources = (guilds: UserGuilds) =>
	Object.values(guilds)
		.filter((guild) => guild.events.length > 0)
		.map((guild) => ({
			id: guild.id,
			name: (
				<div style={{ display: "flex" }}>
					<GuildIcon guild={guild} size={24} style={{ marginRight: 4 }} />
					{guild.name}
				</div>
			),
		}));

const dividerFix = {
	"&::before": { position: "inherit" },
	"&::after": { position: "inherit" },
};

const fetchGuildEvents = (id: string) => fetch(`${APIBase}/${APIRoutes.Events}/?guildId=${id}`).then((result) => result.json<Events>());

export const Home = () => {
	const { headers } = useDiscordOAuth();

	const [guilds, dispatchGuilds] = useReducer(guildsReducer, cleanOldState(getLocalStorage("guilds", {} as UserGuilds)));
	const [options, dispatchOptions] = useReducer(optionsReducer, getLocalStorage("options", { onlyInterested: false } as Options));

	// Viewstates
	const [drawerOpen, setDrawerOpen] = useState(false);

	const [modalOpen, setModalOpen] = useState(false);
	const [modalGuild, setModalGuild] = useState<Guild>();

	const updateSelectedGuildEvents = () => {
		const selectedGuildIds = Object.keys(guilds).filter((id) => guilds[id].selected);
		if (selectedGuildIds.length < 1) return;
		selectedGuildIds.map((id) => fetchGuildEvents(id).then((events) => dispatchGuilds({ do: "updateEvents", events, id })));
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
			fetchGuildEvents(guild.id).then((events) => dispatchGuilds({ do: "select", id: guild.id, events }));
		}
	};

	const onSelectEvent = (event: CalendarEvent) => {
		const discordEvent = guilds;
	};

	const guildArray = Object.values(guilds);

	return (
		<>
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
				<UserProfile />
				{drawerOpen && (
					<>
						<Divider sx={dividerFix}>Options</Divider>
						<Tooltip title="Only show events you have checked interested for">
							<FormControlLabel
								style={{ marginLeft: 8 }}
								control={<Checkbox onClick={() => dispatchOptions({ do: "toggleOnlyInterested" })} checked={options.onlyInterested} />}
								label="Interested Only"
							/>
						</Tooltip>
					</>
				)}
				<Divider sx={dividerFix}>Ready</Divider>
				<List style={{ width: 256 }}>{guildArray.map((guild) => guild.calendarBotIsIn && <GuildButton guild={guild} onClick={() => onSelect(guild)} />)}</List>
				<Divider sx={dividerFix}>Missing Bot</Divider>
				<List style={{ width: 256 }}>{guildArray.map((guild) => !guild.calendarBotIsIn && <GuildButton guild={guild} onClick={() => onSelect(guild)} />)}</List>
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
				resources={buildCalendarResources(guilds)}
				resourceIdAccessor="id"
				resourceTitleAccessor="name"
				step={60}
				onSelectEvent={onSelectEvent}
				style={{ height: "100vh", width: "100%", padding: 16 }}
			/>
		</>
	);
};

const GuildButton = ({ guild, onClick }: { guild: UserGuild; onClick: () => void }) => (
	<ListItemButton key={guild.id} onClick={onClick} selected={guild.selected} dense>
		<GuildIcon guild={guild} style={{ marginRight: 16 }} />
		<ListItemText id={guild.id} primary={guild.name} />
	</ListItemButton>
);
