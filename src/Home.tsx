import { Checkbox, CircularProgress, Divider, FormControlLabel, List, ListItemButton, ListItemText, Tooltip } from "@mui/material";
import { Calendar, momentLocalizer, Event as CalendarEvent } from "react-big-calendar";
import { useEffect, useReducer, useState } from "react";
import moment from "moment";

import { Routes, RouteBases } from "discord-api-types/v10";

// Components
import { useDiscordOAuth } from "./components/DiscordOAuthProvider";
import { getDrawerHelpers } from "./components/Drawer";
import { UserProfile } from "./components/UserProfile";
import { GuildIcon } from "./components/GuildIcon";
import { GuildModal } from "./components/GuildModal";
import { EventModal } from "./components/EventModal";

// Icons
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

// CSS
import "./darkcalendar.scss";

// Helpers
import { buildCalendarObjects } from "./buildCalendarObjects";
import { APIBase, APIRoutes, dividerFix, getLocalStorage } from "./helpers";
import { fetchWithTimeout } from "@inrixia/cfworker-helpers";

// Types
import type { UserGuilds, Event, UserGuild } from "./types";
import type { RESTGetAPICurrentUserGuildsResult as Guilds, RESTGetAPIUserResult as User } from "discord-api-types/v10";

const localizer = momentLocalizer(moment);
const { Drawer } = getDrawerHelpers(256);

type GuildsReducerAction =
	| { do: "set"; guilds: UserGuilds }
	| { do: "unselect"; id: string }
	| { do: "select"; id: string }
	| { do: "updateEvents"; id: string; events: Event[] }
	| { do: "setLoading"; id: string };
const guildsReducer = (state: UserGuilds, action: GuildsReducerAction) => {
	switch (action.do) {
		case "set":
			return setGuildsState(action.guilds);
		case "unselect":
			return setGuildsState({ ...state, [action.id]: { ...state[action.id], selected: false, events: [] } });
		case "select":
			return setGuildsState({ ...state, [action.id]: { ...state[action.id], selected: true, loading: true } });
		case "setLoading":
			return setGuildsState({ ...state, [action.id]: { ...state[action.id], loading: true } });
		case "updateEvents":
			return setGuildsState({ ...state, [action.id]: { ...state[action.id], events: action.events, loading: false } });
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

const fetchGuildEvents = (id: string) => fetch(`${APIBase}/${APIRoutes.Events}/?guildId=${id}`).then((result) => result.json<Event[]>());

export const Home = () => {
	const { headers } = useDiscordOAuth();

	const [user, setUser] = useState<User>();
	const [guilds, dispatchGuilds] = useReducer(guildsReducer, cleanOldState(getLocalStorage("guilds", {} as UserGuilds)));
	const [options, dispatchOptions] = useReducer(optionsReducer, getLocalStorage("options", { onlyInterested: false } as Options));

	// Viewstates
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [guildModal, setGuildModal] = useState<{ open: boolean; guild?: UserGuild }>({ open: false });
	const [eventModal, setEventModal] = useState<{ open: boolean; event?: Event; guild?: UserGuild }>({ open: false });

	const init = async () => {
		// Fetch user
		fetchWithTimeout(`${RouteBases.api}/${Routes.user()}`, { headers })
			.then((result) => result.json<User>())
			.then(setUser);

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
			if (!calendarBotIsIn) _guilds[guild.id] = { ...guild, calendarBotIsIn, selected: false, events: [], loading: false };
			else {
				const selected = guilds[guild.id]?.selected || false;
				const events = guilds[guild.id]?.events || [];
				_guilds[guild.id] = { ...guild, calendarBotIsIn, selected, events, loading: false };
			}
		}
		dispatchGuilds({ do: "set", guilds: _guilds });
		const selectedGuildIds = Object.keys(guilds).filter((id) => guilds[id].selected);
		if (selectedGuildIds.length < 1) return;
		selectedGuildIds.map((id) => {
			dispatchGuilds({ do: "setLoading", id });
			fetchGuildEvents(id).then((events) => dispatchGuilds({ do: "updateEvents", events, id }));
		});
	};

	useEffect(() => {
		init();
	}, []);

	const onSelect = (guild: UserGuild) => {
		// If guild is being unselected just dispatch
		if (guild.selected) dispatchGuilds({ do: "unselect", id: guild.id });
		// If its being selected but the bot is not in that guild then prompt to add
		else if (!guild.calendarBotIsIn) {
			setGuildModal({ guild, open: true });
			// If its being selected and the bot is in that guild then fetch events for that guild
		} else {
			dispatchGuilds({ do: "select", id: guild.id });
			fetchGuildEvents(guild.id).then((events) => dispatchGuilds({ do: "updateEvents", id: guild.id, events }));
		}
	};

	const onSelectEvent = (event: CalendarEvent) =>
		setEventModal({
			open: true,
			// @ts-expect-error Custom property set in buildCalendarObjects for ease of accessing the discord event
			event: event.discordEvent,
			// @ts-expect-error Same as above
			guild: event.discordGuild,
		});

	const guildArray = Object.values(guilds);
	const { events, resources } = buildCalendarObjects(guildArray, options.onlyInterested ? user?.id : undefined);

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
				<UserProfile user={user} />
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
				<List style={{ width: 256 }}>
					{guildArray.map((guild) => guild.calendarBotIsIn && <GuildButton loading={guild.loading} key={guild.id} guild={guild} onClick={() => onSelect(guild)} />)}
				</List>
				<Divider sx={dividerFix}>Missing Bot</Divider>
				<List style={{ width: 256 }}>
					{guildArray.map((guild) => !guild.calendarBotIsIn && <GuildButton loading={guild.loading} key={guild.id} guild={guild} onClick={() => onSelect(guild)} />)}
				</List>
			</Drawer>
			{guildModal.open && (
				<GuildModal
					modalOpen={guildModal.open}
					onClose={(refresh) => {
						setGuildModal({ open: false });
						if (refresh) init();
					}}
					guild={guildModal.guild}
				/>
			)}
			{eventModal.open && (
				<EventModal modalOpen={eventModal.open} onClose={() => setEventModal({ open: false })} event={eventModal.event!} guild={eventModal.guild!} />
			)}
			<Calendar
				dayLayoutAlgorithm="overlap"
				localizer={localizer}
				events={events}
				startAccessor="start"
				endAccessor="end"
				resources={resources}
				resourceIdAccessor="id"
				resourceTitleAccessor="name"
				step={60}
				onSelectEvent={onSelectEvent}
				style={{ height: "100vh", width: "100%", padding: 16 }}
			/>
		</div>
	);
};

const GuildButton = ({ guild, onClick, loading }: { guild: UserGuild; onClick: () => void; loading: boolean }) => (
	<ListItemButton key={guild.id} onClick={onClick} selected={guild.selected} dense disabled={loading}>
		{loading ? <CircularProgress style={{ marginRight: 16 }} /> : <GuildIcon guild={guild} style={{ marginRight: 16 }} />}
		<ListItemText id={guild.id} primary={guild.name} />
	</ListItemButton>
);
